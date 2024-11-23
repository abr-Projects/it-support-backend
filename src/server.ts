import type * as Party from "partykit/server";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import moment from "moment";

const connectionString = process.env.DB as string;
const SECRET = process.env.SECRET as string;
const client = postgres(connectionString);
const db = drizzle(client);
let allnotsentRequests: {}[] = [];
const users = new Map<string, string>();
const connections = new Map<string, any>();
const tokenValidity = 10;
export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) { }
  convertTime(time: number) {
    const date = new Date(time);
    return date.toLocaleTimeString();
  }
  isTokenExpiringSoon(expirationTime : number) {
    const currentTime = Math.floor(Date.now() / 1000);
    return expirationTime - currentTime < (60*tokenValidity)/4;
  }
  async refreshToken(payload: any) {
    const infoObj = {
      id: payload.id,
      password: payload.password,
      access: payload.access,
      exp: Math.floor(Date.now() / 1000) + 60*tokenValidity
    }
    const token = await jwt.sign(
      infoObj,
      SECRET
      
    );
    connections.set(users.get(payload.id)!, infoObj);
    for (const conn of this.room.getConnections()) {
      if (conn.id.toString() == users.get(payload.id)!.toString()) {
      

        conn.send(JSON.stringify({type: "newToken", token: token }));
        break;
      }
    }

  

  }
  async onMessage(message: string, sender: Party.Connection) {
    const req = await JSON.parse(message);
    let infoObj: any;
    if (await jwt.verify(req.token, SECRET)) {
      infoObj = await jwt.decode(req.token);

      users.set(infoObj.payload.id, sender.id);
      connections.set(sender.id, infoObj.payload);
      
      if (this.isTokenExpiringSoon(infoObj.payload.exp)) {
        this.refreshToken(infoObj.payload);
      }
      if (req.type == "update") {
        ///update ticket
        
  
        const data: any = await db.execute(
          sql.raw(
            `SELECT conn_id from request WHERE request_id = '${req.req_id}'`
          )
        );
        let message = {};
        if (req.update == "accept") {
          message = {
            type: "updated",
            update: "accepted",
            req_id: req.req_id,
            name: req.name,
          };
          await db.execute(
            sql.raw(
              `UPDATE request SET rStatus = 'ACCEPTED',technician_id = ${infoObj.payload.id} WHERE request_id = '${req.req_id}'`
            )
          );
        } else if (req.update == "complete") {
          message = {
            type: "updated",
            update: "completed",
            req_id: req.req_id,
            name: req.name,
          };
          await db.execute(
            sql.raw(
              `UPDATE request SET end_ts = NOW(), rStatus = 'COMPLETED' WHERE request_id = '${req.req_id}'`
            )
          );
        }
        let found = false;
        for (const conn of this.room.getConnections()) {
          if (conn.id.toString() == data[0].conn_id.toString()) {
            found = true;
  
            conn.send(JSON.stringify(message));
            break;
          }
        }
        if (found == false) {
          allnotsentRequests.push({ ...req, staff_ID: infoObj.payload.id });
        }
      }
  
      if (req.type == "equipment") {
        
  
        await db.execute(
          sql.raw(`INSERT INTO rental (rental_id, staff_id, rental_date, due_date, purpose) 
                          VALUES ('${req.r_id}', '${infoObj.payload.id}', TO_DATE('${req.rdate}', 'YYYY-MM-DD'), TO_DATE('${req.ddate}', 'YYYY-MM-DD'), '${req.purpose}')`)
        );
  
        await Promise.all(
          req.equipment.map(async (equip: any) => {
  
            if (equip.amount > 0) {
  
              let data = await db.execute(
                sql.raw(`SELECT e.equipment_id
              FROM equipment e 
              LEFT JOIN rent_equipment re ON e.equipment_id = re.equipment_id
              LEFT JOIN rental r ON re.rental_id = r.rental_id
              WHERE e.category = '${equip.name}'
              GROUP BY e.equipment_id
              HAVING MAX(r.due_date) < TO_DATE('${req.rdate}', 'YYYY-MM-DD') OR MAX(r.due_date) IS NULL
              LIMIT ${equip.amount};`)
              );
  
        
              data.forEach(async (item: any) => {
                await db.execute(
                  sql.raw(
                    `INSERT INTO rent_equipment (rental_id, equipment_id) VALUES ('${req.r_id}', '${item.equipment_id}')`
                  )
                );
              });
            }
          })
        );
  
        this.room.broadcast(JSON.stringify(req));
        
      }
      if (req.type == "ticket") {
        //send ticket
      
       
  
        await db.execute(
          sql.raw(`INSERT INTO request (request_id, staff_id, technician_id, dsc, rStatus, classroom, conn_id,created_ts,priority) 
        VALUES ('${req.req_id}', '${infoObj.payload.id.toString()}', 0, '${req.desc
            }', 'PENDING', '${req.room}', '${sender.id}', NOW(),${req.priority})`)
        );
        await Promise.all(
          req.problems.map(async (element: string, index: number) => {
            await db.execute(
              sql.raw(
                `INSERT INTO issues (issue_id,request_id, issue) VALUES ('${index + Date.now().toString()
                }',${req.req_id}, '${element}')`
              )
            );
          })
        );
  
        const onlyTechnicians = Array.from(await this.room.storage.list())
          .filter(([key, value]) => value != "2")
          .map(([key]) => key);
        const rK: string = "token";
  
        const sTicket = { ...req, rStatus: "PENDING" };
  
        delete sTicket[rK];
  
        this.room.broadcast(JSON.stringify(sTicket), onlyTechnicians);
        
      }
      if (req.type == "booking") {
        //send booking
     
       
        const data = await db.execute(
          sql.raw(`INSERT INTO Booking (booking_id,facility_id, staff_id, event_name, event_description, remarks, start_time, end_time, bStatus)
          SELECT ${req.b_id.toString()},${req.facility
            }, ${infoObj.payload.id.toString()}, '${req.eName}', '${req.eDesc}', '${req.remarks
            }',  to_timestamp('${req.bDate + " " + req.sTime
            }', 'YYYY-MM-DD HH24:MI'), to_timestamp('${req.bDate + " " + req.eTime
            }', 'YYYY-MM-DD HH24:MI'), 'PENDING'
          WHERE NOT EXISTS (
              SELECT 1
              FROM Booking
              WHERE facility_id =  ${req.facility}
              AND NOT (start_time >= to_timestamp('${req.bDate + " " + req.eTime
            }', 'YYYY-MM-DD HH24:MI') OR end_time <= to_timestamp('${req.bDate + " " + req.sTime
            }', 'YYYY-MM-DD HH24:MI'))
          ) RETURNING *;`)
        );
        console.log(data);
        if (data.length == 0) {
          sender.send(
            JSON.stringify({
              type: "error",
              status: "The facility has already been booked at that time",
            })
          );
        } else {
          const rK: string = "token";
  
          const sBooking = { ...req, bStatus: "PENDING" };
  
          delete sBooking[rK];
          this.room.broadcast(JSON.stringify(sBooking));
        }
        
      }
      if (req.type == "updateB") {
        //update booking
        const data: any = await db.execute(
          sql.raw(
            `UPDATE booking SET bstatus = 'APPROVED' WHERE booking_id = '${req.b_id}'`
          )
        );
        this.room.broadcast(JSON.stringify({ ...req, bStatus: "APPROVED" }));
      }
      if (req.type == "updateTicket") {
        
      
        if (infoObj.payload.access != "1") {
          throw new Error("You don't have access to this");
        }
  
        let created_ts = moment(req.created_ts, "MM/DD/YYYY, h:mm:ss A").format(
          "YYYY-MM-DD HH:mm:ss"
        );
        let end_ts = moment(req.end_ts, "MM/DD/YYYY, h:mm:ss A").format(
          "YYYY-MM-DD HH:mm:ss"
        );
  
        let created_ts_query =
          created_ts == "Invalid date"
            ? `NULL`
            : `to_timestamp('${created_ts}', 'YYYY-MM-DD HH24:MI:SS')`;
  
        let end_ts_query =
          end_ts == "Invalid date"
            ? `NULL`
            : `to_timestamp('${end_ts}', 'YYYY-MM-DD HH24:MI:SS')`;
  
        const data = await db.execute(
          sql.raw(
            `UPDATE request SET classroom = '${req.room}', dsc = '${req.desc}', priority = '${req.priority}', created_ts = ${created_ts_query}, end_ts = ${end_ts_query}, technician_id = '${req.technician_el}', rstatus = '${req.rstatus}' WHERE request_id = '${req.req_id}'`
          )
        );
        await Promise.all(
          req.problems
            .split(",")
            .map(async (element: string, index: number) => {
              await db.execute(
                sql.raw(
                  `UPDATE issues SET issue = '${element}' WHERE request_id = '${req.req_id}';`
                )
              );
            })
        );
  
        const rK: string = "token";
        delete req[rK];
  
        this.room.broadcast(JSON.stringify(req));
        
      }
      if (req.type == "updateBooking") {
        
    
        if (infoObj.payload.access != "1") {
          throw new Error("You don't have access to this");
        }
  
        await db.execute(
          sql.raw(
            `UPDATE booking SET start_time = to_timestamp('${req.bDate} ${req.sTime}', 'YYYY-MM-DD HH24:MI:SS'), end_time = to_timestamp('${req.bDate} ${req.eTime}', 'YYYY-MM-DD HH24:MI:SS'), event_name = '${req.eName}', event_description = '${req.eDesc}', remarks = '${req.remarks}', facility_id = ${req.facility}, bstatus = '${req.bStatus}' WHERE booking_id = '${req.b_id}';`
          )
        );
  
        const rK: string = "token";
        delete req[rK];
  
        this.room.broadcast(JSON.stringify(req));
        
      }
      if (req.type == "updateEStatus") {
        
          if (infoObj.payload.access == "2") {
            let status = "Rejected";
            if (req.status == "Approve") {
              status = "Approved";
            }
            if (req.status == "Returned") {
              status = "Returned";
            }
            await db.execute(
              sql.raw(
                `UPDATE rental SET rstatus = '${status}' WHERE rental_id = '${req.r_id}';`
              )
            );
          }
          this.room.broadcast(JSON.stringify(req));
        
      }
  
      if (req.type == "catchup") {
        
        if (allnotsentRequests.length > 0) {
          allnotsentRequests.forEach((req) => {
            if ((req as any).staff_ID == infoObj.payload.id) {
              sender.send(JSON.stringify(req));
              allnotsentRequests.splice(allnotsentRequests.indexOf(req), 1);
            }
          });
        }
        
      }
    }

    
  }

  async onRequest(req: Party.Request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
     
    };
    
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    interface LoginRequest {
      type: String;
      id: Number;
      password: String;
    }

    interface TokensRequest {
      type: String;
      token: String;
    }

    interface generalRequest {
      type: String;
    }

    interface surveyRequest {
      type: String;
      token: String;
      req_id: string;

      speed: string;
      quality: string;
      attitude: string;

      comment: string;
    }
    interface staffPerformanceRequest {
      type: String;
      token: String;
      category: string;
      month: number;
      year: number;
      order: string;
    }

    interface staffStatRequest {
      type: String;
      token: String;
      month: number;
      year: number;
    }

    interface facilitystatRequest {
      type: String;
      token: String;
      category: string;
      month: number;
      year: number;
    }

    interface editProfileRequest {
      type: string;
      token: string;
      email: string;
      phone: string;
      passw: string;
    }

    interface adminEditProfileRequest {
      type: string;
      token: string;
      email: string;
      phone: string;
      passw: string;
      access: string;
    }

    interface adminAddStaffRequest {
      type: string;
      fname: string;
      lname: string;
      gender: string;
      access: string;
      email_address: string;
      phone_number: string;
      passw: string;
      token: string;
    }
    if (req.method == "POST") {
      const r = (await req.json()) as generalRequest;

      if (r.type == "login") {
        const lR: LoginRequest = r as LoginRequest;
        console.log(lR);
        const data = await db.execute(
          sql.raw(
            `SELECT passw ,access,first_name,last_name,id FROM staff WHERE id = ${lR.id.toString()};`
          )
        );
        
        if (data.length == 0) {
          return new Response(JSON.stringify({ state: "User not found" }), {
            status: 404,
            headers,
          });
        } else if (lR.password != data[0].passw) {
          return new Response(
            JSON.stringify({ state: "Invalid credentials" }),
            { status: 401, headers }
          );
        } else {
          const token = await jwt.sign(
            {
              id: lR.id,
              password: lR.password,
              access: data[0].access,
              exp: Math.floor(Date.now() / 1000) + 60*tokenValidity
            },
            SECRET
            
          );

          const name = data[0].first_name + " " + data[0].last_name;

          return new Response(
            JSON.stringify({
              state: "Access granted",
              token: token,
              name: name,
              access: data[0].access,
            }),
            { status: 200, headers }
          );
        }
      } else {
        const tR: TokensRequest = r as TokensRequest;
        if (await jwt.verify(String(tR.token), SECRET)) {
          const infoObj: any = await jwt.decode(String(tR.token));
          let data;
          if (r.type == "profile") {
            data = await db.execute(
              sql.raw(`SELECT * FROM staff WHERE id = ${infoObj.payload.id};`)
            );
            console.log(data);
          }
          if (r.type == "editProfile") {
            const epr: editProfileRequest = r as editProfileRequest;
            data = await db.execute(
              sql.raw(
                `UPDATE staff SET email_address = '${epr.email}', phone_number = '${epr.phone}', passw = '${epr.passw}' WHERE id = '${infoObj.payload.id}'`
              )
            );
          }
          if (r.type == "aEditProfile") {
            const epr: adminEditProfileRequest = r as adminEditProfileRequest;
            data = await db.execute(
              sql.raw(
                `UPDATE staff SET email_address = '${epr.email}', phone_number = '${epr.phone}', passw = '${epr.passw}',access= '${epr.access} WHERE id = '${infoObj.payload.id}'`
              )
            );
          }
          if (r.type == "addStaff") {
            //THIS Is A MISTAke

            const aasr: adminAddStaffRequest = r as adminAddStaffRequest;
            data = await db.execute(
              sql.raw(
                `INSERT INTO staff (id,first_name,last_name,gender,access,email_address,phone_number,passw) VALUES (${aasr.fname},${aasr.lname},${aasr.gender},${aasr.access},${aasr.email_address},${aasr.phone_number},${aasr.passw});`
              )
            );
          }

          if (r.type == "checkEquipment") {
            data = await db.execute(
              sql.raw(`SELECT 
    te.category,
    (te.count - COALESCE(re.count, 0)) AS count
FROM 
    totalequipment te
LEFT JOIN 
    rentedequipment re ON te.category = re.category
ORDER BY 
    te.category;

`)
            );
          }
          if (r.type == "allEquipment") {
            data = await db.execute(
              sql.raw(`SELECT 
    r.rental_id as r_id,
    r.rental_date as rDate,
    r.due_date as dDate,
    r.purpose as purpose,
    r.rstatus,
    CONCAT(s.first_name, ' ', s.last_name) AS name, 
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'name', eq.category,
            'amount', eq.amount
        )
    ) AS equipment
FROM 
    rental r
JOIN 
    staff s ON r.staff_id = s.id
JOIN 
    (
        SELECT 
            re.rental_id,
            e.category,
            COUNT(e.equipment_id) AS amount
        FROM 
            rent_equipment re
        JOIN 
            equipment e ON re.equipment_id = e.equipment_id
        GROUP BY 
            re.rental_id, e.category
    ) AS eq ON r.rental_id = eq.rental_id
GROUP BY 
    r.rental_id, r.rental_date, r.due_date, r.purpose, r.rstatus, s.first_name, s.last_name
ORDER BY 
    r.rental_id;
`)
            );
          }

          if (r.type == "myTickets") {
            data = await db.execute(
              sql.raw(`SELECT r.request_id, r.staff_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, concat(s.first_name, ' ', s.last_name) as name , string_agg(i.issue, ', ') AS issues,
              COALESCE(concat(t.first_name, ' ', t.last_name), 'N/A') as technician, r.end_ts as end_ts
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            LEFT JOIN staff t ON r.technician_id = t.id
            WHERE r.staff_id = ${infoObj.payload.id}
            GROUP BY r.request_id, r.staff_id, s.first_name, s.last_name, r.dsc, r.classroom, t.first_name, t.last_name`)
            );
          }  if (r.type == "tickets") {
            if (infoObj.payload.access != "2") {
              return new Response(JSON.stringify({ state: "Access denied" }), {
                status: 401,
                headers,
              });
            }
            data = await db.execute(
              sql.raw(`SELECT r.request_id, r.staff_id, r.technician_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            WHERE r.technician_id = ${infoObj.payload.id} OR r.technician_id = 0
            GROUP BY r.request_id, r.staff_id, r.technician_id , s.first_name, s.last_name, r.dsc, r.classroom`)
            );
          }  if (r.type == "bookings") {
            data = await db.execute(
              sql.raw(`SELECT s.id, booking_id, s.first_name, s.last_name, f.facility_id, facilityType,event_name,event_description,remarks,start_time,end_time,bstatus FROM booking b, facility f,staff s 
              WHERE b.facility_id = f.facility_id AND b.staff_id = s.id`)
            );
          }  if (r.type == "survey") {
            const sR: surveyRequest = r as surveyRequest;

            data = await db.execute(
              sql.raw(
                `INSERT INTO survey (request_id, speed, quality, attitude, comment, staff_id) SELECT '${sR.req_id}', ${sR.speed}, ${sR.quality}, ${sR.attitude}, '${sR.comment}', '${infoObj.payload.id}' WHERE EXISTS (SELECT 1 FROM request WHERE request_id = '${sR.req_id}' AND staff_id = '${infoObj.payload.id}') RETURNING *;`
              )
            );
            if (data.length == 0) {
              return new Response(JSON.stringify({ status: "No permission" }), {
                status: 401,
                headers,
              });
            }
          }  if (r.type == "aTickets") {
            if (infoObj.payload.access != "1") {
              return new Response(JSON.stringify({ state: "Access denied" }), {
                status: 401,
                headers,
              });
            }

            let tickets = await db.execute(
              sql.raw(`SELECT r.request_id, r.staff_id, r.technician_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, r.end_ts ,concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            GROUP BY r.request_id, r.staff_id, r.technician_id , s.first_name, s.last_name, r.dsc, r.classroom`)
            );
            let staff = await db.execute(
              sql.raw(
                `SELECT id, access, concat(first_name,' ',last_name) as name FROM staff`
              )
            );
            data = { tickets: tickets, staff: staff };
          }  if (r.type == "aStaff") {
            if (infoObj.payload.access != "1") {
              return new Response(JSON.stringify({ state: "Access denied" }), {
                status: 401,
                headers,
              });
            }

            data = await db.execute(
              sql.raw(
                `SELECT id, access, concat(first_name,' ',last_name) as name FROM staff`
              )
            );
          }  if (r.type == "surveyResults") {
            const ssR: staffStatRequest = r as staffStatRequest;
            console.log(ssR);
            data = await db.execute(
              sql.raw(
                `SELECT EXTRACT(YEAR FROM end_ts) AS "year", EXTRACT(MONTH FROM end_ts) AS "month", AVG(s.speed) AS "speed", AVG(s.quality) AS "quality", AVG(s.attitude) AS "attitude" FROM survey s JOIN request r ON r.request_id = s.request_id WHERE r.rstatus = 'COMPLETED' AND EXTRACT(YEAR FROM end_ts) = ${ssR.year} AND EXTRACT(MONTH FROM end_ts) = ${ssR.month} GROUP BY EXTRACT(YEAR FROM end_ts), EXTRACT(MONTH FROM end_ts);`
              )
            );
            console.log(data);
          }  if (r.type == "facilityStats") {
            const ssR: staffStatRequest = r as staffStatRequest;
            data = await db.execute(
              sql.raw(
                `SELECT facilitytype, COALESCE(SUM(CASE WHEN b.facility_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS count FROM facility f LEFT JOIN booking b ON b.facility_id = f.facility_id AND EXTRACT(YEAR FROM start_time) = ${ssR.year} AND EXTRACT(MONTH FROM start_time) = ${ssR.month} GROUP BY facilitytype ORDER BY facilitytype`
              )
            );
          }  if (r.type == "equipmentStats") {
            const ssR: staffStatRequest = r as staffStatRequest;
            data = await db.execute(
              sql.raw(`SELECT 
    e.category,
    COUNT(r.rental_id) AS count
FROM 
    equipment e
LEFT JOIN 
    rent_equipment re ON e.equipment_id = re.equipment_id
LEFT JOIN 
    rental r ON re.rental_id = r.rental_id
AND 
    EXTRACT(MONTH FROM r.rental_date) = ${ssR.month} AND EXTRACT(YEAR FROM r.rental_date) = ${ssR.year}
GROUP BY 
    e.category
ORDER BY 
    e.category;
`)
            );
          }  if (r.type == "specificFacilityStats") {
            const fsr: facilitystatRequest = r as facilitystatRequest;
            data = await db.execute(
              sql.raw(
                `SELECT f.facility_name, COUNT(b.facility_id) FROM facility f LEFT JOIN booking b ON b.facility_id = f.facility_id WHERE f.facilitytype = '${fsr.category}' GROUP BY f.facility_name ORDER BY f.facility_name`
              )
            );
      
          }  if (r.type == "staffRanking") {
            const pR: staffPerformanceRequest = r as staffPerformanceRequest;
            data = await db.execute(
              sql.raw(
                `SELECT concat(st.first_name,' ',st.last_name) as name, r.technician_id,  AVG(${pR.category}) AS averageValue FROM survey s,request r,staff st WHERE EXTRACT(YEAR FROM end_ts) = ${pR.year} AND EXTRACT(MONTH FROM end_ts) = ${pR.month} AND s.request_id = r.request_id and r.technician_id = st.id GROUP BY name,r.technician_id ORDER BY averageValue ${pR.order} LIMIT 5`
              )
            );
            console.log(data);
          }  if (r.type == "staffStats") {
            const ssR: staffStatRequest = r as staffStatRequest;
            if (infoObj.payload.access == "2") {
              let totalRequests = await db.execute(
                sql.raw(
                  `SELECT rstatus,COUNT(*) AS count FROM request WHERE technician_id = ${infoObj.payload.id} AND EXTRACT(YEAR FROM end_ts) = ${ssR.year} AND EXTRACT(MONTH FROM end_ts) = ${ssR.month} GROUP BY rstatus`
                )
              );
              let ratings = await db.execute(
                sql.raw(
                  `SELECT r.technician_id, AVG(speed) as speed,AVG(quality) as quality, AVG(attitude) AS attitude FROM survey s,request r WHERE r.technician_id = ${infoObj.payload.id} AND s.request_id = r.request_id AND EXTRACT(YEAR FROM end_ts) = ${ssR.year} AND EXTRACT(MONTH FROM end_ts) = ${ssR.month} GROUP BY r.technician_id`
                )
              );
              data = { totalRequests: totalRequests, ratings: ratings };
            }
            if (infoObj.payload.access == "3") {
              let totalRequests = await db.execute(
                sql.raw(
                  `SELECT rstatus, COUNT(*) AS count FROM request WHERE staff_id = ${infoObj.payload.id} AND EXTRACT(YEAR FROM end_ts) = ${ssR.year} AND EXTRACT(MONTH FROM end_ts) = ${ssR.month} GROUP BY rstatus`
                )
              );
              let totalBookings = await db.execute(
                sql.raw(
                  `SELECT bstatus, COUNT(*) AS count FROM booking WHERE staff_id = ${infoObj.payload.id} AND EXTRACT(YEAR FROM start_time) = ${ssR.year} AND EXTRACT(MONTH FROM start_time) = ${ssR.month} GROUP BY bstatus`
                )
              );

              data = {
                totalRequests: totalRequests,
                totalBookings: totalBookings,
              };
            }
          }

          return new Response(JSON.stringify(data), { status: 200, headers });
        }
      }
    }

    return new Response("ERR", { status: 404, headers });
  }
}

Server satisfies Party.Worker;
