import type * as Party from "partykit/server";
import jwt from '@tsndr/cloudflare-worker-jwt'
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from 'drizzle-orm' 
import postgres from "postgres";




const connectionString = process.env.DB as string;
const SECRET = process.env.SECRET as string
const client = postgres(connectionString);
const db = drizzle(client);
let allnotsentRequests: {}[] = [];
export default class Server implements Party.Server {
  
  constructor(readonly room: Party.Room) {}
  convertTime(time: number) {
    const date = new Date(time);
    return date.toLocaleTimeString();
  }
  async onMessage(message: string, sender: Party.Connection) {
    const req = await JSON.parse(message)
 
    if(req.type == "update"){
      ///update ticket
      let infoObj : any 
      if(await jwt.verify(req.token,SECRET)){
         infoObj = await jwt.decode(req.token)
      }
     

      const data : any = await db.execute(sql`SELECT conn_id from request WHERE request_id = '${sql.raw(req.req_id)}'`)
      let message = {}
      if (req.update == "accept"){
         message = {
          type:'updated',
          update:"accepted",
          req_id:req.req_id,
          name:req.name
        }
        await db.execute(sql`UPDATE request SET rStatus = 'ACCEPTED',technician_id = '${sql.raw(infoObj.payload.id)}' WHERE request_id = '${sql.raw(req.req_id)}'`)//CHECK IF STAFF IS TECHNICIAN

      }
      else if (req.update == "complete"){
        message = {
          type:'updated',
          update:"completed",
          req_id:req.req_id,
          name:req.name
        }
        await db.execute(sql`UPDATE request SET end_ts = NOW(), rStatus = 'COMPLETED' WHERE request_id = '${sql.raw(req.req_id)}'`)
      }
      let found = false
      for (const conn of this.room.getConnections()) {
        if (conn.id.toString() == data[0].conn_id.toString()) {
            found = true

            conn.send(JSON.stringify(message));
            break
        }

      }
      if (found == false){
        allnotsentRequests.push({...req,staff_ID:infoObj.payload.id})
        
      }

    }
    if (req.type == "ticket"){
      //send ticket
      if(await jwt.verify(req.token,SECRET)){

        const info : any = await jwt.decode(req.token)

        await  db.execute(sql`INSERT INTO request (request_id, staff_id, technician_id, dsc, rStatus, classroom, conn_id,created_ts,priority) 
        VALUES ('${sql.raw(req.req_id)}', '${sql.raw(info.payload.id.toString())}', 0, '${sql.raw(req.desc)}', 'PENDING', '${sql.raw(req.room)}', '${sql.raw(sender.id)}', NOW(),${sql.raw(req.priority)})`);
          await Promise.all(req.problems.map(async (element: string, index: number) => {
      
            await db.execute(sql`INSERT INTO issues (issue_id,request_id, issue) VALUES ('${sql.raw(index+Date.now().toString())}','${sql.raw(req.req_id)}', '${sql.raw(element)}')`);
        }));

        
        const onlyTechnicians = Array.from(await this.room.storage.list()).filter(([key, value]) => value != '2').map(([key]) => key);
        const rK: string = 'token';

        const sTicket = {...req,rStatus:'PENDING'}
   
        delete sTicket[rK];

        this.room.broadcast(JSON.stringify(sTicket),onlyTechnicians)


      }
    }
    if(req.type == "booking"){
      //send booking
      if(await jwt.verify(req.token,SECRET)){

        const info : any = await jwt.decode(req.token)
        const data = await db.execute(sql`INSERT INTO Booking (booking_id,facility_id, staff_id, event_name, event_description, remarks, start_time, end_time, bStatus)
          SELECT ${sql.raw(req.b_id.toString())},${sql.raw(req.facility)}, ${sql.raw(info.payload.id.toString())}, '${sql.raw(req.eName)}', '${sql.raw(req.eDesc)}', '${sql.raw(req.remarks)}',  to_timestamp('${sql.raw(req.bDate+" "+req.sTime)}', 'YYYY-MM-DD HH24:MI'), to_timestamp('${sql.raw(req.bDate+" "+req.eTime)}', 'YYYY-MM-DD HH24:MI'), 'PENDING'
          WHERE NOT EXISTS (
              SELECT 1
              FROM Booking
              WHERE facility_id =  ${sql.raw(req.facility)}
              AND NOT (start_time >= to_timestamp('${sql.raw(req.bDate+" "+req.eTime)}', 'YYYY-MM-DD HH24:MI') OR end_time <= to_timestamp('${sql.raw(req.bDate+" "+req.sTime)}', 'YYYY-MM-DD HH24:MI'))
          ) RETURNING *;`);
          console.log(data)
          if(data.length == 0){
            sender.send(JSON.stringify({type:"error",status:"The facility has already been booked at that time"}))
          }
          else{
            const rK: string = 'token';

            const sBooking = {...req,bStatus:'PENDING'}
       
            delete sBooking[rK];
            this.room.broadcast(JSON.stringify(sBooking))
          }
     
        
      }
      
    }
    if(req.type == "updateB"){
      //update booking
      const data : any = await db.execute(sql`UPDATE booking SET bstatus = 'APPROVED' WHERE booking_id = '${sql.raw(req.b_id)}'`)
      this.room.broadcast(JSON.stringify({...req,bStatus:'APPROVED'}))

    }
    if(req.type == "updateTicket"){
      if(await jwt.verify(req.token,SECRET)){

        const info : any = await jwt.decode(req.token)
        if(info.payload.access != "1"){
          // await  db.execute(sql`UPDATE request  ('${sql.raw(req.req_id)}', '${sql.raw(info.payload.id.toString())}', 0, '${sql.raw(req.desc)}', 'PENDING', '${sql.raw(req.room)}', '${sql.raw(sender.id)}', NOW(),${sql.raw(req.priority)})`);
          const uTicket = {...req,admin:true}
          const rK: string = 'token';
          delete uTicket[rK];
          
          this.room.broadcast(uTicket)
        }
      }
     
    }
  }

  async onRequest(req: Party.Request){

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    
    
    interface LoginRequest {
      type: String;
      id : Number;
      password:String
    }

    interface TicketsRequest {
      type: String;
      token :String
    }
    

    interface generalRequest {
      type: String
    }

    interface surveyRequest {
      type: String;
      token :String
      req_id: string;
        
      speed: string;
      quality: string;
      attitude: string;
        
      comment: string
    }

   
    if(req.method == "POST") {
      const r = await req.json() as generalRequest
      if(r.type == "login") {

        const lR: LoginRequest = r as LoginRequest;
 
        const data = await db.execute(sql`SELECT passw ,access,first_name,last_name FROM staff s`)
        if(data.length == 0) {
          return new Response(JSON.stringify({state:'User not found'}), { status: 404, headers });
        } else if (lR.password != data[0].passw) {
          return new Response(JSON.stringify({state:'Invalid credentials'}), { status: 401, headers });
        } else {
          const token = await jwt.sign({
            id: lR.id,
            password: lR.password,
            access: data[0].access
          }, SECRET)

          const name =  data[0].first_name + " " + data[0].last_name;
          let moreRes: any[] = [];
          if(allnotsentRequests.length > 0){
            allnotsentRequests.forEach(req => {
              if ((req as any).staff_ID == lR.id){
                moreRes.push(req)
                allnotsentRequests.splice(allnotsentRequests.indexOf(req), 1)
  
                
              }
            });
            
          }
        
          return new Response(JSON.stringify({state:'Access granted',token:token,name:name,access:data[0].access,catchUp:moreRes}), { status: 200, headers });
        }
      }
      else{
        const tR: TicketsRequest = r as TicketsRequest;
        if(await jwt.verify(String(tR.token),SECRET)){
          const infoObj : any = await jwt.decode(String(tR.token)) 
          let data
          if(r.type == "myTickets"){
      
        
             data = await db.execute(sql`SELECT r.request_id, r.staff_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            WHERE r.staff_id = '${sql.raw(infoObj.payload.id)}'
            GROUP BY r.request_id, r.staff_id, s.first_name, s.last_name, r.dsc, r.classroom`)
         
    
          }
          else if(r.type == "tickets"){
            if(infoObj.payload.access != "2"){
              return new Response(JSON.stringify({state:'Access denied'}), { status: 401, headers });
            }
             data = await db.execute(sql`SELECT r.request_id, r.staff_id, r.technician_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            WHERE r.technician_id = '${sql.raw(infoObj.payload.id)}' OR r.technician_id = '${sql.raw('0')}'
            GROUP BY r.request_id, r.staff_id, r.technician_id , s.first_name, s.last_name, r.dsc, r.classroom`)
    
          }
          else if(r.type == "bookings"){
             data = await db.execute(sql`SELECT booking_id, s.first_name, s.last_name, f.facility_id, facilityType,event_name,event_description,remarks,start_time,end_time,bstatus FROM booking b, facility f,staff s 
              WHERE b.facility_id = f.facility_id AND b.staff_id = s.id`)
     

          }
          else if(r.type =="survey"){
            const sR: surveyRequest = r as surveyRequest;

            if(await jwt.verify(String(sR.token),SECRET)){
              const infoObj : any = await jwt.decode(String(sR.token))
              data = await db.execute(sql`INSERT INTO survey (request_id, speed, quality, attitude, comment,staff_id) VALUES ('${sql.raw(sR.req_id)}', ${sql.raw(sR.speed)}, ${sql.raw(sR.quality)}, ${sql.raw(sR.attitude)}, '${sql.raw(sR.comment)}' , '${sql.raw(infoObj.payload.id)}') WHERE staff_id = (SELECT staff_id FROM request WHERE request_id = '${sql.raw(sR.req_id)}') RETURNING *;`)
              if(data.length == 0){
                return new Response(JSON.stringify({status:'No permission'}), { status: 401, headers });
              }
              
            }
          }
          else if(r.type == "aTickets"){
            if(infoObj.payload.access != "1"){
              return new Response(JSON.stringify({state:'Access denied'}), { status: 401, headers });
            }
      
            let tickets = await db.execute(sql`SELECT r.request_id, r.staff_id, r.technician_id, r.rstatus ,r.dsc, r.classroom ,r.priority,r.created_ts, r.end_ts ,concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
            FROM request r
            LEFT JOIN issues i ON r.request_id = i.request_id
            LEFT JOIN staff s ON r.staff_id = s.id
            GROUP BY r.request_id, r.staff_id, r.technician_id , s.first_name, s.last_name, r.dsc, r.classroom`)
            let staff = await db.execute(sql`SELECT id, access, concat(first_name,' ',last_name) as name FROM staff`)
            data = {tickets:tickets,staff:staff}


          }
          
          return new Response(JSON.stringify(data), { status: 200, headers });
        }

      }
      


        
    }
    
    return new Response('ERR', { status: 404, headers });
  }
}

Server satisfies Party.Worker;