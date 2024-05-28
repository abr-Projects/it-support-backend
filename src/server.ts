import type * as Party from "partykit/server";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from 'drizzle-orm' 
import postgres from "postgres";
import jwt from '@tsndr/cloudflare-worker-jwt'


const connectionString = process.env.DB as string;
const SECRET = process.env.SECRET as string
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);
export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    const req = await JSON.parse(message)
    if (req.type == "ready"){
      if(this.room.storage.get(sender.id) != null){
        this.room.storage.put(sender.id,req.access)
      }

      
    }
    if(req.type == "accept"){
      const data : any = await db.execute(sql`SELECT conn_id from request WHERE request_id = '${sql.raw(req.req_id)}'`)
      console.log(data)
      await db.execute(sql`UPDATE request SET rStatus = 'ACCEPTED' WHERE request_id = '${sql.raw(req.req_id)}'`)
      for (const conn of this.room.getConnections()) {
        if (conn.id.toString() == data[0].conn_id.toString()) {
          const acceptMessage = {
            type:'accepted',
            name:req.name
          }
          conn.send(JSON.stringify(acceptMessage));
        }
      }

    }
    if (req.type == "ticket"){
      console.log("ticked received")
      if(await jwt.verify(req.auth,SECRET)){

        const info : any = await jwt.decode(req.auth)
        console.log(info)
        await db.execute(sql`INSERT INTO request (request_id, staff_id, technician_id, dsc, rStatus, classroom, conn_id) 
        VALUES ('${sql.raw(req.req_id)}', '${sql.raw(info.payload.id.toString())}', 0, '${sql.raw(req.desc)}', 'PENDING', '${sql.raw(req.room)}', '${sql.raw(sender.id)}')`);
          await Promise.all(req.problems.map(async (element: string, index: number) => {
            console.log(element);
            await db.execute(sql`INSERT INTO issues (issue_id,request_id, issue) VALUES ('${sql.raw(index+Date.now().toString())}','${sql.raw(req.req_id)}', '${sql.raw(element)}')`);
        }));

        
        const onlyTechnicians = Array.from(await this.room.storage.list()).filter(([key, value]) => value != '2').map(([key]) => key);
        const rK: string = 'auth';

        const sTicket = {...req}
        delete sTicket[rK];

        this.room.broadcast(JSON.stringify(sTicket),onlyTechnicians)


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
    
    if(req.method == "POST") {
      const r = await req.json() as LoginRequest;
      if(r.type == "login") {
        const data = await db.execute(sql`SELECT passw , occupation,first_name,last_name FROM useracc u, staff s WHERE u.u_id = s.id and u_id = ${r.id}`)

        if(data.length == 0) {
          return new Response(JSON.stringify({state:'User not found'}), { status: 404, headers });
        } else if (r.password != data[0].passw) {
          return new Response(JSON.stringify({state:'Invalid credentials'}), { status: 401, headers });
        } else {
          const token = await jwt.sign({
            id: r.id,
            password: r.password,
          }, SECRET)
          const name =  data[0].first_name + " " + data[0].last_name;
        
          return new Response(JSON.stringify({state:'Access granted',token:token,name:name,access:data[0].occupation}), { status: 200, headers });
        }
      }
      else if(r.type == "tickets"){
        const data = await db.execute(sql`SELECT r.request_id, r.staff_id, r.dsc, r.classroom, concat(s.first_name,' ',s.last_name) as name , string_agg(i.issue, ', ') AS issues
        FROM request r
        LEFT JOIN issues i ON r.request_id = i.request_id
        LEFT JOIN staff s ON r.staff_id = s.id
        WHERE r.rStatus = 'PENDING'
        GROUP BY r.request_id, r.staff_id, s.first_name, s.last_name, r.dsc, r.classroom`)
   
        return new Response(JSON.stringify(data), { status: 200, headers });

      }
    }
    
    return new Response('ERR', { status: 404, headers });
  }
}

Server satisfies Party.Worker;