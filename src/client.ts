
import "./styles.css";

import PartySocket from "partysocket";

declare const PARTYKIT_HOST: string;

const problems = ["General IT","No Sound","Cannot Open Files","Projector Failure","Monitors no display","Others"]


const ws = new PartySocket({
  host: PARTYKIT_HOST,
  room: "global",
  id:  localStorage.getItem("conn_id") !
 

});


function preventInput(e:any){
  const inputField = <HTMLInputElement>e.target
  let inputValue = parseInt(inputField.value);
  inputValue = isNaN(inputValue) ? parseInt(e.key) : parseInt(inputValue.toString()+e.key)

  if (inputValue > parseInt(inputField.max) || inputValue < parseInt(inputField.min)){
      e.preventDefault();

    
  }
}



window.document.addEventListener("DOMContentLoaded",function(){

 
  
  if (window.document.location.pathname == '/'){
    window.document.getElementById("login")!.onclick = async function() {

      const id = (<HTMLInputElement>document.getElementById("staffId")).value
      const password = (<HTMLInputElement>document.getElementById("password")).value
    
        PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "login", id: id, password: password }),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {
    
          localStorage.setItem("Token", data.token);
          localStorage.setItem("Access", data.access);
          localStorage.setItem("Name",data.name);
          if (localStorage.getItem("conn_id") === null){
            localStorage.setItem('conn_id',localStorage.getItem("Access")!+Date.now())
          }
          if (localStorage.getItem("Access") === "2"){
            window.location.assign('/support.html')

          }
          else if(localStorage.getItem("Access") === "3"){
            window.location.assign('/ticket.html')

          }
        })    
    };
  }
  else if(window.document.location.pathname == '/ticket.html'){
    if (localStorage.getItem("Access") === null){
      window.location.assign('/')
    }
    ws.send(JSON.stringify({type:"ready",access:localStorage.getItem("Access")}))
    
    problems.forEach((el) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = el.trim();
      checkbox.value = el;
      checkbox.name = "problems"

  
      const label = document.createElement('label');
      label.htmlFor = el.trim();
      label.textContent = " " + el + " ";

      window.document.getElementById("problems")!.appendChild(checkbox)

      window.document.getElementById("problems")!.appendChild(label)

    })
    window.document.getElementById("floor")!.addEventListener("keydown", preventInput)
    window.document.getElementById("room")!.addEventListener("keydown", preventInput)
    window.document.getElementById("submit")!.onclick = async function() {
      console.log("SUBMITED")
      document.getElementById("status")!.innerHTML = "IT FAILURE (PENDING)"
      const floor = (<HTMLInputElement>document.getElementById("floor")).value
      const room = (<HTMLInputElement>document.getElementById("room")).value
      const desc = (<HTMLTextAreaElement>document.getElementById("description")).value
      let selectedProblems: string[] = [];
      let checkboxes = document.getElementsByName('problems') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((el: HTMLInputElement) => {
        if (el.checked) {
          selectedProblems.push(el.value);
        }
      });

      const ticket = {
        type:"ticket",
        req_id: Date.now(),
        room: floor + room, 
        problems: selectedProblems,
        desc: desc,
        name:localStorage.getItem("Name"),
        auth: localStorage.getItem("Token")
        
      };
      console.log(ticket)
      ws.send(JSON.stringify(ticket))

    
    }
  }
  else if(window.document.location.pathname == '/support.html'){
    if (localStorage.getItem("Access") === null){
      window.location.assign('/')
    }
    PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "tickets",auth:localStorage.getItem("Token")}),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {

          console.log(data)
          data.forEach((el : any) => {
            const row = document.createElement("tr");


            const req_id = document.createElement("td");
            req_id.textContent = el.request_id;
            row.appendChild(req_id);

            const name = document.createElement("td");
            name.textContent = el.name
            row.appendChild(name);

            const room = document.createElement("td");
            room.textContent = el.classroom
            row.appendChild(room);

            const desc = document.createElement("td");
            desc.textContent = el.dsc
            row.appendChild(desc);

            const problems = document.createElement("td");
            problems.textContent = el.issues
            row.appendChild(problems);

            const accept = document.createElement("td");
            const aBtn = document.createElement("button");
            aBtn.textContent = "Accept";
            aBtn.addEventListener("click", () => {
              const acceptMessage  = {
                type:"accept",
                name:localStorage.getItem("Name"),
                req_id: el.request_id
              }
              ws.send(JSON.stringify(acceptMessage))
              row.remove()
              
            });
            accept.appendChild(aBtn);
            
            row.appendChild(accept);

            const table = document.getElementById("tickets")!;
            table.appendChild(row);
            
          });
        })
    
  }
})

ws.addEventListener("message", (message : any) => {
  if(window.document.location.pathname == '/support.html'){
    const ticket = JSON.parse(message.data)
    const row = document.createElement("tr");


    const req_id = document.createElement("td");
    req_id.textContent = ticket.req_id;
    row.appendChild(req_id);

    const name = document.createElement("td");
    name.textContent = ticket.name;
    row.appendChild(name);

    const room = document.createElement("td");
    room.textContent = ticket.room;
    row.appendChild(room);

    const desc = document.createElement("td");
    desc.textContent = ticket.desc;
    row.appendChild(desc);

    const problems = document.createElement("td");
    problems.textContent = ticket.problems.join(", ");
    row.appendChild(problems);

    const accept = document.createElement("td");
    const aBtn = document.createElement("button");
    aBtn.textContent = "Accept";
    aBtn.addEventListener("click", () => {
      const acceptMessage  = {
        type:"accept",
        name:localStorage.getItem("Name"),
        req_id: ticket.req_id
      }
      ws.send(JSON.stringify(acceptMessage))
      row.remove();
      
      
    });
    accept.appendChild(aBtn);
    
    row.appendChild(accept);

    const table = document.getElementById("tickets")!;
    table.appendChild(row);



  }
  if(window.document.location.pathname == '/ticket.html'){
    const acceptMessage = JSON.parse(message.data)
    if (acceptMessage.type == "accepted"){
      document.getElementById("status")!.innerHTML = `IT FAILURE (ACCEPTED BY ${acceptMessage.name})`

    }
  }
  

});

