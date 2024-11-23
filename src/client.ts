import "./styles.css";

import PartySocket from "partysocket";
import { Chart, type ChartEvent } from 'chart.js/auto';



declare const PARTYKIT_HOST: string;
let idleTimeout: ReturnType<typeof setTimeout>;
const idleTimeLimit = 10 * 60 * 1000;
const problems = ["General IT","No Sound","Cannot Open Files","Projector Failure","Monitors no display","Others"]
const leadZero = (num: number, places: number) => String(num).padStart(places, '0')
interface Booking {
  b_id: string;
  bDate: string;
  sTime: string;
  eTime: string;
  eName: string;
  eDesc: string;
  remarks: string;
  facility: string;
  facilityType: string;
  name: string;
  bStatus:string,
}
interface Equipment {
  r_id: string;
  rdate: string;
  ddate: string;
  purpose: string;
  name: string;
  rstatus: string;
  equipment: {
      name: string;
      amount: number;
  }[];
}

let allBookings: Booking[] = [];
let allEquipments: Equipment[] = [];
interface Facility {
  id: string;
  name: string;
  image: string;
}

interface Facilities {
  [key: string]: Facility[];
}
const facilities: Facilities = {
  "Art Rooms": [
      {
          id: "1",
          name: "Arts Room 1",
          image: "/assets/art1"
      },
      {
          id: "2",
          name: "Arts Room 2",
          image: "/assets/art2"
      }
  ],
  "Music Rooms": [
      {
          id: "3",
          name: "Music Room 1",
          image: "/assets/music1"
      },
      {
          id: "4",
          name: "Music Room 2",
          image: "/assets/music2"
      }
  ],
  "Computer Rooms": [
      {
          id: "5",
          name: "Computer Room 1",
          image: "/assets/computer1"
      },
      {
          id: "6",
          name: "Computer Room 2",
          image: "/assets/computer2"
      }
  ],
  "Meeting Rooms": [
      {
          id: "9",
          name: "Meeting Room 1",
          image: "/assets/meeting1"
      },
      {
          id: "10",
          name: "Meeting Room 2",
          image: "/assets/meeting2"
      }
  ],
  "Sport Playgrounds": [
      {
          id: "11",
          name: "Swimming Pool",
          image: "/assets/pool"
      },
      {
          id: "12",
          name: "Track and Field",
          image: "/assets/track"
      },
      {
          id: "13",
          name: "Soccer Field",
          image: "/assets/soccer"
      },
      {
          id: "14",
          name: "Basketball Court",
          image: "/assets/basketball"
      }
  ],
  "Hall": [
      {
          id: "7",
          name: "Hall 1",
          image: "/assets/hall1"
      },
      {
          id: "8",
          name: "Hall 2",
          image: "/assets/hall2"
      }
  ]
};

const fColors: { [key: string]: string } = {
  "Art_Rooms": "red",
  "Music_Rooms": "orange",
  "Computer_Rooms": "yellow",
  "Meeting_Rooms": "green",
  "Sport_Playgrounds": "blue",
  "Hall": "purple"
};

const eColors: { [key: string]: string } = {
  "microphone": "red",
  "ipad": "orange",
  "laserpointer": "yellow",
  "videocamera": "green",

};


const priorities: { [key: string]: string } = {
  '1': 'Low',
  '2': 'Medium',
  '3': 'High',


}
const accesstoRole: { [key: string]: string } = {
  '1': 'Admin',
  '2': 'IT Staff',
  '3': 'Staff',


}

let temp = {}

let filterColors = ["red", "orange", "yellow", "green", "blue", "purple"];

const ws = new PartySocket({
  host: PARTYKIT_HOST,
  room: "global",
  id:  localStorage.getItem("conn_id") !
  
  

});

function convertTime(time: number) {
  const date = new Date(time);
  return date.toLocaleString();
}
function convertTimeWithTimeZone(time : number) {
  if(time == null) return null
  const date = new Date(time + 8 * 60 * 60 * 1000); // Adding 8 hours in milliseconds
  return date.toLocaleString();
}

function preventInput(e: KeyboardEvent) {
  const inputField = e.target as HTMLInputElement;
  const key = e.key;


  if (!/^\d$/.test(key) && 
      !['Backspace', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    e.preventDefault();
    return;
  }

  let inputValue = inputField.value;
  let newValue: number;

  if (key == 'Backspace') {
    newValue = parseInt(inputValue.slice(0, -1));
  } else {
    newValue = parseInt(inputValue + key);
  }


  if (newValue > parseInt(inputField.max) || newValue < parseInt(inputField.min) ) {
    if(!isNaN(newValue)){ //allow backspace for 1 char integer
      e.preventDefault();
    }

  }
}

function logout() {
  localStorage.removeItem("conn_id");
  localStorage.removeItem("Token");
  localStorage.removeItem("Access");
  localStorage.removeItem("Name");
  window.location.href = "/";
}

function resetIdleTimer() {
  clearTimeout(idleTimeout); // Clear the previous timer
  idleTimeout = setTimeout(logout, idleTimeLimit); // Start a new timer
}

["mousemove", "keydown", "scroll", "touchstart"].forEach((event) => {
  window.addEventListener(event, resetIdleTimer);
});


window.document.addEventListener("DOMContentLoaded",function(){
  resetIdleTimer();
  Array.from(document.getElementsByClassName("close")).forEach(btn => {
    btn.addEventListener("click", () => {
      const parentElement = btn.parentElement?.parentElement;
      if (parentElement) {
        parentElement.style.display = "none";
      }
    })
  });
  document.getElementById("logout")?.addEventListener("click", () => {
    logout();
  })
  const tickets = document.getElementById("tickets");
  if (tickets) {
  const tr = tickets.getElementsByTagName("tr");
  
  let th = tr[0].getElementsByTagName("th")

  const filter = document.getElementById("filter")!;

  for (let i = 0; i < th.length; i++) {


    if(th[i].textContent == "Action" || th[i].textContent == "Survey" || th[i].textContent == "Edit") continue

    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = th[i].textContent;

    
    filter.appendChild(option);

  }
  const input = <HTMLInputElement> document.getElementById("search")!;
  input.addEventListener("keyup", filterFunction);
    
  function filterFunction() {
    let input, filter, td, i, txtValue;
    input = <HTMLInputElement> document.getElementById("search")!;
    filter = input.value.toString().toUpperCase();

    
    for (i = 0; i < tr.length; i++) {
    
      const filterSelect = <HTMLSelectElement> <unknown> document.getElementById("filter")!;
      const filterValue = filterSelect.options[filterSelect.selectedIndex].value;
      td = tr[i].getElementsByTagName("td")[parseInt(filterValue)];
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }       
    }
  }
  }
      
         
  if (window.document.location.pathname == '/'){
    if (localStorage.getItem("Access") == "2"){
      window.location.assign('/support.html')

    }
    else if(localStorage.getItem("Access") == "3"){
      window.location.assign('/ticket.html')

    }
    else if(localStorage.getItem("Access") == "1"){
      window.location.assign('/admin/ticket.html')

    }
  
    window.document.getElementById("login")!.onclick = async function() {

      const id = (<HTMLInputElement>document.getElementById("staffId")).value
      const password = (<HTMLInputElement>document.getElementById("password")).value
      if(isNaN(parseInt(id))){
        alert("Please enter a valid ID")
        return
      }
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
        
          if(res.status == 404){
            alert("User not found, please try again")
          }
          if(res.status == 401){
            alert("Invalid credentials, please try again")
          }
          return res.json();
        }).then(function(data : any) {
          temp = data
          localStorage.setItem("Token", data.token);
          localStorage.setItem("Access", data.access);
          localStorage.setItem("Name",data.name);
          ws.send(JSON.stringify({ type: "catchup", token: data.token}));
          if (localStorage.getItem("conn_id") == null){
            localStorage.setItem('conn_id',localStorage.getItem("Access")!+Date.now())
          }
          if (localStorage.getItem("Access") == "2"){
            window.location.assign('/support.html')

          }
          else if(localStorage.getItem("Access") == "3"){
            window.location.assign('/ticket.html')

          }
          else if(localStorage.getItem("Access") == "1"){
            window.location.assign('/admin/ticket.html')

          }
        })    

        
    };
  }
  else if(window.document.location.pathname == '/ticket.html'){
    if (localStorage.getItem("Access") == null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") == "2"){
      window.location.assign('/support.html')
    }


    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {

        method: "POST",
        body: JSON.stringify({ type: "myTickets",token:localStorage.getItem("Token")}),
      }
    ) .then(function(res) {
      if(!res.ok){
        console.log("YOU ARE NOT OK!")
      }
      return res.json();
    }).then(function(data : any) {
        data.forEach((el : any) => {
          
          const ticket = el;
          console.log(ticket)

          const row = document.createElement("tr");


          const req_id = document.createElement("td");
          req_id.textContent = ticket.request_id;
          row.appendChild(req_id);


          const room = document.createElement("td");
          room.textContent = ticket.classroom;
          row.appendChild(room);

          const desc = document.createElement("td");
          desc.textContent = ticket.dsc;
          row.appendChild(desc);

          const problems = document.createElement("td");

          problems.textContent = ticket.issues
          row.appendChild(problems);
          
          const priorityEl = document.createElement("td");
          priorityEl.textContent = priorities[ticket.priority.toString()]
          row.appendChild(priorityEl);
    
          const created_tsEl = document.createElement("td");
          created_tsEl.textContent = convertTimeWithTimeZone(ticket.created_ts)
          row.appendChild(created_tsEl);
    
          const end_tsEl = document.createElement("td");
          end_tsEl.textContent = convertTimeWithTimeZone(ticket.end_ts) ?? "N/A"
          row.appendChild(end_tsEl);

          const technician_el = document.createElement("td");
          if (ticket.technician === "Default Technician") {
            technician_el.textContent = "N/A"
          } else {
            technician_el.textContent = ticket.technician
          }
          row.appendChild(technician_el);
    
      
          const status = document.createElement("td");
          status.textContent = ticket.rstatus
          row.appendChild(status);
    
          const table = document.getElementById("tickets")!;
          table.appendChild(row);
      


       
      })
    })

    window.document.getElementById("title")!.textContent = "What issues are you facing "+localStorage.getItem("Name")+"?"
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
    
      const floor = (<HTMLInputElement>document.getElementById("floor")).value
      const room = leadZero(parseInt((<HTMLInputElement>document.getElementById("room")).value),2)
      const desc = (<HTMLTextAreaElement>document.getElementById("description")).value
      const priority = document.getElementById("priority") as HTMLSelectElement | null;
      
      let sProb: string[] = [];
      let checkboxes = document.getElementsByName('problems') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((el: HTMLInputElement) => {
        if (el.checked) {
          sProb.push(el.value);
        }
      });



      if (floor == "" || room == "" || desc == "" || sProb.length == 0) {
        alert("Please fill in all fields");
        return;
      }
      (<HTMLInputElement>document.getElementById('floor')).value = '';
      (<HTMLInputElement>document.getElementById('room')).value = '';
      (<HTMLTextAreaElement>document.getElementById('description')).value = '';

      const cbs = document.querySelectorAll('#problems input[type="checkbox"]:checked');
      cbs.forEach((cb : any) => {
        cb.checked = false;
      });
      alert("Your ticket has been submitted. Thank you for your patience.")
      const req_id = Date.now();
      const ticket = {
        type:"ticket",
        req_id: req_id,
        room: floor + room, 
        problems: sProb,
        desc: desc,
        name:localStorage.getItem("Name"),
        token: localStorage.getItem("Token"),
        priority: priority ? priority.value : '1',
        created_ts: req_id
        
      };

      ws.send(JSON.stringify(ticket))
      
  
      const row = document.createElement("tr");


      const req_id_el = document.createElement("td");
      req_id_el.textContent = req_id.toString();
      row.appendChild(req_id_el);

      const classroom = document.createElement("td");
      classroom.textContent = floor + room
      row.appendChild(classroom);

      const description = document.createElement("td");
      description.textContent = desc
      row.appendChild(description);

      const problems = document.createElement("td");
      problems.textContent = sProb.join(", ");
      row.appendChild(problems);

      const priorityEl = document.createElement("td");
      priorityEl.textContent = priorities[priority ? priority.value : '1']
      row.appendChild(priorityEl);

      const created_tsEl = document.createElement("td");
      
      created_tsEl.textContent = convertTime(req_id)//TIME IS CONVERTED
      row.appendChild(created_tsEl);

      const end_tsEl = document.createElement("td");
      end_tsEl.textContent = 'N/A'
      row.appendChild(end_tsEl);

      const technician = document.createElement("td");
      technician.textContent = 'N/A'
      row.appendChild(technician);

      const rstatus = document.createElement("td");
      rstatus.textContent = 'PENDING'
      row.appendChild(rstatus);

      const table = document.getElementById("tickets")!;
      table.appendChild(row);
        
    }


    document.getElementById("submitSurvey")!.onclick = async function() {

      const speed = Array.from(document.getElementsByName("rSpeed") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const quality = Array.from(document.getElementsByName("rQuality") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const attitude = Array.from(document.getElementsByName("rAttitude") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const comment = (document.getElementById("comment") as HTMLTextAreaElement).value;

      const survey = {
        type: "survey",
        req_id: document.getElementById("survey")!.getAttribute("req_id")!, //MAY CAUSE PROBLEM
        
        speed: speed,
        quality: quality,
        attitude: attitude,
        
        comment: comment,
        token: localStorage.getItem("Token")
      }

      PartySocket.fetch(
        {
          host: PARTYKIT_HOST,
          room: "global",
        },
        {
  
          method: "POST",
          body: JSON.stringify(survey),
        }
      ) .then(function(res) {
        if(!res.ok){
          alert("ERROR! TRY AGAIN!")
        }
        else{
          return res.json();
        }
   
      }).then(function(data : any) {

        alert("Thank you for your feedback!")
        document.getElementById("takeSurvey")!.remove();
        document.getElementById("survey")!.style.display = "none";
        
      })

      
    }
    
    window.document.getElementById('reset')!.onclick = function(){
      (<HTMLInputElement>document.getElementById('floor')).value = '';
      (<HTMLInputElement>document.getElementById('room')).value = '';
      (<HTMLTextAreaElement>document.getElementById('description')).value = '';

      const cbs = document.querySelectorAll('#problems input[type="checkbox"]:checked');
      cbs.forEach((cb : any) => {
        cb.checked = false;
      });

    }
  }
  else if(window.document.location.pathname == '/support.html'){
    if (localStorage.getItem("Access") == null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") == "3"){
      window.location.assign('/ticket.html')
    }
    PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "tickets",token:localStorage.getItem("Token")}),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {


          data.forEach((el : any) => {
            


            const row = document.createElement("tr");


            const req_id_el = document.createElement("td");
            req_id_el.textContent = el.request_id
            row.appendChild(req_id_el);
            const staff_el = document.createElement("td");
            staff_el.textContent = el.name
            row.appendChild(staff_el);

            const classroom = document.createElement("td");
            classroom.textContent = el.classroom
            row.appendChild(classroom);
      
            const description = document.createElement("td");
            description.textContent = el.dsc
            row.appendChild(description);
      
            const problems = document.createElement("td");
            problems.textContent = el.issues
            row.appendChild(problems);
      
            const priorityEl = document.createElement("td");
            priorityEl.textContent = priorities[el.priority]
            row.appendChild(priorityEl);
      
            const created_tsEl = document.createElement("td");
            created_tsEl.textContent = convertTime(el.created_ts)
            row.appendChild(created_tsEl);
      
            const end_tsEl = document.createElement("td");
            end_tsEl.textContent = 'N/A'
            row.appendChild(end_tsEl);
      
  
      
            const status = document.createElement("td");
            status.textContent = el.rstatus
            row.appendChild(status);
      


            const action = document.createElement("td");
            const aBtn = document.createElement("button");
   
            if (el.rstatus == "PENDING"){
              aBtn.textContent = "Accept";
            
            }
            else if(el.rstatus == "ACCEPTED"){
              aBtn.textContent = "Complete";
            }
            else{
              aBtn.remove()
            }

            aBtn.addEventListener("click", () => {
    
              if(aBtn.textContent == "Accept"){
             
                const acceptMessage  = {
                  type:"update",
                  update:"accept",
                  name:localStorage.getItem("Name"),
                  token: localStorage.getItem("Token"),
                  req_id: el.request_id
                }
                ws.send(JSON.stringify(acceptMessage))
                status.textContent = "ACCEPTED"
                aBtn.textContent = "Complete"
                aBtn.disabled = true;
                setTimeout(() => {
                  aBtn.disabled = false;
                } , 1000);
              }
              else if(aBtn.textContent == "Complete"){
                const completeMessage  = {
                  type:"update",
                  update:"complete",
                  name:localStorage.getItem("Name"),
                  token: localStorage.getItem("Token"),
                  req_id: el.request_id
                }
                ws.send(JSON.stringify(completeMessage))
                status.textContent = "COMPLETED"
                aBtn.remove()
              }
             
              
              
      
            })
   
           
            action.appendChild(aBtn);
            
            row.appendChild(action);

            const table = document.getElementById("tickets")!;
            table.appendChild(row);
            
          });
        })
    
  }
  else if(window.document.location.pathname == '/profile.html'){
    if(localStorage.getItem("Access") == "1"){

      console.log(document.getElementsByTagName("a"))
      const anc = document.createElement("a");
      anc.href = "admin/user.html"
      anc.textContent = "User"
      document.getElementsByClassName("align-right")[0].insertBefore(anc,document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[2]);
      (document.querySelector(".navbar .title")! as HTMLAnchorElement).href = "admin/ticket.html"
      document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[0].href = "admin/ticket.html"
      document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[1].href = "admin/booking.html"
      document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[3].href = "admin/equipment.html"
      
    }
    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {
        method: "POST",
        body: JSON.stringify({ type: "staffStats", token: localStorage.getItem("Token") , month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
      }
    ).then(function(res) {
      if(!res.ok){
        console.log("YOU ARE NOT OK!")
      }
      return res.json();

    })
    .then(function(data : any) {
      console.log(data)
      const statContainer = document.getElementById('staff_info')?.getElementsByClassName('container')[1]!;
      const rstatus  = ["PENDING", "ACCEPTED", "COMPLETED"]
      data.totalRequests.forEach((el : any) => {
        if(rstatus.includes(el.rstatus)){
          rstatus.splice(rstatus.indexOf(el.rstatus), 1)
        }

        const content = document.createElement("div")
        content.textContent = el.rstatus + " - " + el.count
        statContainer.appendChild(content);
      })

      rstatus.forEach((el : any) => {
        const content = document.createElement("div")
        content.textContent = el + " - 0"
        statContainer.appendChild(content);
      })
     
      if (localStorage.getItem("Access") == "2"){
        const canvas = document.createElement('canvas');
        statContainer.appendChild(canvas);
        const ctx = canvas.getContext('2d')!;

        console.log(data)
       
            
        let performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Speed', 'Quality', 'Attitude'],
                datasets: [{
                    label: 'Average Values',
                    data: [data.ratings[0].speed, data.ratings[0].quality, data.ratings[0].attitude],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    barThickness: 100,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    },
                }
                
            }
        });
        
        
        
      }
      if (localStorage.getItem("Access") == "3"){
        const bstatus  = ["PENDING", "APPROVED", "DECLINED"]
        data.totalBookings.forEach((el : any) => {
          if(bstatus.includes(el.bstatus)){
            bstatus.splice(bstatus.indexOf(el.bstatus), 1)
          }

          const content = document.createElement("div")
          content.textContent = el.bstatus + " - " + el.count
          statContainer.appendChild(content);
        })

        rstatus.forEach((el : any) => {
          const content = document.createElement("div")
          content.textContent = el + " - 0"
          statContainer.appendChild(content);
        })
      }
      if (localStorage.getItem("Access") == "1"){
        

        const content = document.createElement("div")
        content.textContent = "NO STATS FOR ADMIN"
        statContainer.appendChild(content);
      
      }
      
    })
    if (localStorage.getItem("Access") == "2"){
      (document.querySelector(".navbar .title")! as HTMLAnchorElement).href = "/support.html"
      document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[0].href = "/support.html"
    }
    
    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {
        method: "POST",
        body: JSON.stringify({ type: "profile", token: localStorage.getItem("Token") }),
      }
    )
    .then(function(res) {
      if(!res.ok){
        console.log("YOU ARE NOT OK!")
      }
      return res.json();

    })
    .then(function(data : any) {

      const staffContainer = document.getElementById('staff_info')?.getElementsByClassName('container')[0]!;
      staffContainer.getElementsByClassName('name')[0].textContent = localStorage.getItem("Name")
      staffContainer.getElementsByClassName('email')[0].textContent = `Email: ${data[0].email_address}`
      staffContainer.getElementsByClassName('phone')[0].textContent = `Phone: ${data[0].phone_number}`
      staffContainer.getElementsByClassName('role')[0].textContent = accesstoRole[data[0].access];
      (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).value = data[0].passw
      staffContainer.getElementsByClassName("Edit")[0].addEventListener("click", () => {
        if(staffContainer.getElementsByClassName('Edit')[0].textContent == "Save"){
          (staffContainer.getElementsByClassName('Edit')[0] as HTMLButtonElement).disabled  = true;
          (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).disabled = true;
          (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).type = "password"


          staffContainer.getElementsByClassName('email')[0].textContent = `Email: ${staffContainer.getElementsByClassName('email')[0].querySelector("input")!.value}`
          staffContainer.getElementsByClassName('phone')[0].textContent = `Phone: ${staffContainer.getElementsByClassName('phone')[0].querySelector("input")!.value}`
          const editMessage  = {
            type:"editProfile",
            token: localStorage.getItem("Token"),
            email: staffContainer.getElementsByClassName('email')[0].textContent,
            phone: staffContainer.getElementsByClassName('phone')[0].textContent,
            passw: (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).value
          }
          console.log(editMessage)
          PartySocket.fetch(
            {
              host: PARTYKIT_HOST,
              room: "global",
            },
            {
              method: "POST",
              body: JSON.stringify(editMessage),
            }
          ) .then(function(res) {
            if(!res.ok){
              console.log("YOU ARE NOT OK!")
            }
            alert("Profile Updated")
          })
          setTimeout(() => {
            (staffContainer.getElementsByClassName('Edit')[0] as HTMLButtonElement).disabled  = false
            staffContainer.getElementsByClassName('Edit')[0].textContent = "Edit";
          },1000)

        }
        else{
          (staffContainer.getElementsByClassName('Edit')[0] as HTMLButtonElement).disabled  = true;
          staffContainer.getElementsByClassName('email')[0].innerHTML = `<input type="text" value="${data[0].email_address}">`
          staffContainer.getElementsByClassName('phone')[0].innerHTML = `<input type="text" value="${data[0].phone_number}">`;
          (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).disabled = false;
          (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).type = "text"

          setTimeout(() => {
            (staffContainer.getElementsByClassName('Edit')[0] as HTMLButtonElement).disabled  = false
            staffContainer.getElementsByClassName('Edit')[0].textContent = "Save";
          },1000)
        }
        
      })

    })
    


  }
  else if(window.document.location.pathname == '/booking.html' || window.document.location.pathname == '/admin/booking.html'){
    if (localStorage.getItem("Access") == null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") == "2"){
      (document.querySelector(".navbar .title")! as HTMLAnchorElement).href = "/support.html"
      document.getElementsByClassName("align-right")[0].getElementsByTagName("a")[0].href = "/support.html"
    }
    if (localStorage.getItem("Access") == "1"){

      document.getElementById("statBtn")!.addEventListener("click", () => {

        var sForm = document.getElementById("stats")!;
        sForm.style.display = "block";
        const monthSelect = document.getElementById('monthSelector') as unknown as HTMLSelectElement;
        const index = new Date().getMonth();
        monthSelect.selectedIndex = index;
        renderChart(index)
      })
      
     

      document.getElementById('monthSelector')! .addEventListener("change", () => {
        const chartCanvas = document.getElementById("facilityChart") as HTMLCanvasElement;
        const chart = Chart.getChart(chartCanvas); 
        if (chart) {
          chart.destroy(); 
        }
        renderChart((document.getElementById('monthSelector')! as unknown as HTMLSelectElement).selectedIndex)
      });

      function renderChart(month: number) {
        PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "facilityStats",token:localStorage.getItem("Token"),year: new Date().getFullYear(),month: month+1}),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {
            
    
          console.log(data)
          const ctx = (document.getElementById('facilityChart') as HTMLCanvasElement).getContext('2d')!;
       
          const facilitiesArray = Object.keys(facilities);
          console.log(facilitiesArray)
          let performanceChart = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: facilitiesArray,
                  datasets: [{
                      label: 'Total',
                      data: [data[0].count, data[4].count, data[1].count, data[3].count, data[5].count , data[2].count],
                      backgroundColor: [
                          'red',
                          'orange',
                          'yellow',
                          'green',
                          'blue',
                          'purple'

                      ],
                      borderColor: [
                          'red',
                          'orange',
                          'yellow',
                          'green',
                          'blue',
                          'purple'
                      ],
                      barThickness: 10,
                      borderWidth: 1
                  }]
              },
              options: {
                  
                  indexAxis: 'y',
                  onClick: (event : ChartEvent) => {
                      const clickedElementIndex = performanceChart.getElementsAtEventForMode(event.native ?? {} as Event, 'nearest', { intersect: true }, true);
                      if (clickedElementIndex?.length) {
                          const index = clickedElementIndex[0].index;
                          const category = facilitiesArray[index];
                          console.log(category)
                          handleBarClick(category);
                      }
                  }
              }
          });
        })
      }
      


        async function handleBarClick(category : string) {
          const chartCanvas = document.getElementById("sFacilityChart") as HTMLCanvasElement;
        const chart = Chart.getChart(chartCanvas); 
        if (chart) {
          chart.destroy(); 
        }
            const monthSelect = document.getElementById('month') as unknown as HTMLSelectElement;
            const month = parseInt(monthSelect.value, 10);
            PartySocket.fetch(
              {
                host: PARTYKIT_HOST,
                room: "global",
              },
              {
        
                method: "POST",
                body: JSON.stringify({ type: "specificFacilityStats",token:localStorage.getItem("Token"),category: category,month: month,year: new Date().getFullYear(),order:"DESC"}),
              }
            ) .then(function(res) {
              if(!res.ok){
                console.log("YOU ARE NOT OK!")
              }
              return res.json();
            }).then(function(data : any) {

              console.log(data)
              const ctx = (document.getElementById('sFacilityChart') as HTMLCanvasElement).getContext('2d')!;
       
          
              let sFacilityChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: data.map((d : any) => d.facility_name),
                      datasets: [{
                          label: 'Total',
                          data: data.map((d : any) => d.count),
                          backgroundColor: [
                              'red',
                              'orange',
                              'yellow',
                              'green',
                              'blue',
                              'purple'

                          ],
                          borderColor: [
                              'red',
                              'orange',
                              'yellow',
                              'green',
                              'blue',
                              'purple'
                          ],
                          barThickness: 10,
                          borderWidth: 1
                      }]
                  },
                  options: {
                      
                      indexAxis: 'y',
                      
                  }
              });
 
            })
        }
    }

    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {

        method: "POST",
        body: JSON.stringify({ type: "bookings",token:localStorage.getItem("Token")}),
      }
    ) .then(function(res) {
      if(!res.ok){
        console.log("YOU ARE NOT OK!")
      }
      return res.json();
    }).then(function(data : any) {

  
      data.forEach((res : any) => {

        const box = document.createElement("div");
        box.classList.add("box");
        box.id = res.booking_id
        box.style.backgroundColor = fColors[res.facilitytype.replace(" ","_")];
        const bDateV = res.start_time.split(" ")[0]
        
        box.addEventListener("click", () => {
          var bForm = document.getElementById("bookingForm")!;
          bForm.style.display = "block";
          const bDate = document.getElementById("bDate") as HTMLInputElement;
          const sTime = document.getElementById("sTime") as HTMLInputElement;
          const eTime = document.getElementById("eTime") as HTMLInputElement;
          const eName = document.getElementById("eName") as HTMLInputElement;
          const eDesc = document.getElementById("eDesc") as HTMLInputElement;
          const remarks = document.getElementById("remarks") as HTMLInputElement;
          bForm.getElementsByClassName("title")[0].textContent = `Edit ${res.first_name+" "+res.last_name}'s Booking`;
          bDate.value = bDateV;
          sTime.value = res.start_time.split(" ")[1].split(":")[0] + ":" + res.start_time.split(" ")[1].split(":")[1];
          eTime.value = res.end_time.split(" ")[1].split(":")[0] + ":" + res.end_time.split(" ")[1].split(":")[1];
          eName.value = res.event_name;
          eDesc.value = res.event_description;
          remarks.value = res.remarks;

          if(localStorage.getItem("Access") == "1"){
            const statuses = ["PENDING", "APPROVED"]
            const group = document.createElement("div")
            group.classList.add("group")
            
            const label = document.createElement("label")
            label.textContent = "Status"
            group.appendChild(label)


            const selectbStatus = document.createElement("select")
            selectbStatus.id = "bStatus"

            group.appendChild(selectbStatus)
            statuses.forEach((el) => {
              if(el == res.bstatus){
                selectbStatus.add(new Option(el, "selected"))
              }
              else{
                selectbStatus.add(new Option(el))
              }
            })
   
            bForm.insertBefore(group,document.getElementsByClassName("title")[2]);
          }

          const roomBtns = document.getElementsByClassName("roomBtn")
          

       
          for (let i = 0; i < roomBtns.length; i++) {
            if(roomBtns[i].textContent == res.facilitytype){
              (roomBtns[i] as HTMLButtonElement).click();
              break;
            }
          }
          const facility = document.getElementById(res.facility_id)
          facility?.classList.add("selected")
          const submit = document.getElementById("submit")! as HTMLInputElement;


          if(localStorage.getItem("Access") == "2"){
            submit.value = "Approve"
            submit.setAttribute("b_id",res.booking_id)
          }
          if(localStorage.getItem("Access") == "1"){
            submit.value = "Edit"
            submit.setAttribute("b_id",res.booking_id)
          }
        })

        //check for missing fields 

       
        
        const bReq = {
          b_id: res.booking_id,
          bDate: bDateV,
          sTime: res.start_time.split(" ")[1].split(":")[0] + ":" + res.start_time.split(" ")[1].split(":")[1],
          eTime: res.end_time.split(" ")[1].split(":")[0] + ":" + res.end_time.split(" ")[1].split(":")[1],
          eName: res.event_name,
          eDesc: res.event_description,
          remarks: res.remarks,
          facility: res.facility_id,
          facilityType: res.facilitytype,
          name: res.first_name+" "+res.last_name,
          bStatus:res.bstatus,
        }
        allBookings.push(bReq);
    
  
        const id = bDateV.split("-")[1] + "/" + bDateV.split("-")[2];
    
        const info = document.createElement("div");
        info.classList.add("info");
        
        const time = document.createElement("div");
        time.classList.add("time");
        time.textContent = res.start_time.split(" ")[1].split(":")[0] + ":" + res.start_time.split(" ")[1].split(":")[1] + "-" + res.end_time.split(" ")[1].split(":")[0] + ":" + res.end_time.split(" ")[1].split(":")[1];
        
        const status = document.createElement("div");
        status.classList.add("status");
        status.textContent = res.bstatus;
  
  
        const b_id = document.createElement("div");
        b_id.classList.add("b_id");
        b_id.textContent =`#${res.booking_id}`;
        const content = document.createElement("div");
        content.classList.add("content");
        content.textContent = `${res.event_name} - ${res.first_name+" "+res.last_name} - ${res.facilitytype}`
     
        info.appendChild(time);
        info.appendChild(status);
        info.appendChild(b_id)
        info.appendChild(content);
        box.appendChild(info);
  
        const day = document.getElementById(id)!
    
        if (day) {
          day.getElementsByClassName("bContainer")[0].appendChild(box);
        }
    
      });

    })

  
    const roomButtons = Array.from(document.getElementsByClassName("roomBtn"));


    roomButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const container = document.getElementById("facilitiesContainer")!;
            container.textContent ="";
            const fName = (e.target as HTMLButtonElement).textContent!;
            const facility = facilities[fName]
            facility.forEach((facility : Facility) => {
              const group = document.createElement('div');
              group.classList.add('group');
              group.setAttribute("facilityType",fName.replace(" ","_"));
              group.id = facility.id;
  
              const img = document.createElement('img');
              img.src = facility.image+".jpg";
  
              const label = document.createElement('label');
              label.textContent = facility.name;
              group.appendChild(img);
              group.appendChild(label);
              group.addEventListener('click', () => {
          
                Array.from(container.children).forEach((g) => {
                  g.classList.remove("selected");
                })
                group.classList.add("selected");
              })
              container.appendChild(group);
            }) 
        });
    });

    const daysContainer = document.getElementById("days")!;
    const nextBtn = document.getElementById("next")!;
    const prevBtn = document.getElementById("prev")!;
    const month = document.getElementById("month")!;

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

  
    const date = new Date();
    let currentMonth = date.getMonth();
    let currentYear = date.getFullYear();

    const renderCalendar = () => {
 
        daysContainer.textContent = ""
        date.setDate(1);
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const lastDayIndex = lastDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDay = new Date(currentYear, currentMonth, 0);
        const prevLastDayDate = prevLastDay.getDate();
        const nextDays = 7 - lastDayIndex - 1;

        month.innerHTML = `${months[currentMonth]} ${currentYear}`;

        for (let x = firstDay.getDay(); x > 0; x--) {
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth,2)}/${leadZero(prevLastDayDate - x + 1,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${prevLastDayDate - x + 1}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);

        }

        for (let i = 1; i <= lastDayDate; i++) {
          
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth+1,2)}/${leadZero(i,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${i}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);
          
        }

        for (let j = 1; j <= nextDays; j++) {
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth+2,2)}/${leadZero(j,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${j}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);
        }
   
        allBookings.forEach(res => {
          const box = document.createElement("div");
          box.id = res.b_id;
          box.classList.add("box");
          box.style.backgroundColor = fColors[res.facilityType.replace(" ","_")]

          box.addEventListener("click", () => {
       
            var bForm = document.getElementById("bookingForm")!;
            bForm.style.display = "block";
            const bDate = document.getElementById("bDate") as HTMLInputElement;
            const sTime = document.getElementById("sTime") as HTMLInputElement;
            const eTime = document.getElementById("eTime") as HTMLInputElement;
            const eName = document.getElementById("eName") as HTMLInputElement;
            const eDesc = document.getElementById("eDesc") as HTMLInputElement;
            const remarks = document.getElementById("remarks") as HTMLInputElement;
            bDate.value = res.bDate;
          
            sTime.value = res.sTime;
            eTime.value = res.eTime;
            eName.value = res.eName;
            eDesc.value = res.eDesc;
            remarks.value = res.remarks;
            const roomBtns = document.getElementsByClassName("roomBtn")

            for (let i = 0; i < roomBtns.length; i++) {
              if(roomBtns[i].textContent == res.facilityType.replace("_"," ")){
                (roomBtns[i] as HTMLButtonElement).click();
                break;
              }
            }
            const facility = document.getElementById(res.facility)
            facility?.classList.add("selected")

            const submit = document.getElementById("submit")! as HTMLInputElement;


            if(localStorage.getItem("Access") == "2"){
              submit.value = "Approve"
              submit.setAttribute("b_id",res.b_id)
            }

          })

          const id = res.bDate.split("-")[1] + "/" + res.bDate.split("-")[2];
  
          const info = document.createElement("div");
          info.classList.add("info");
          
          const time = document.createElement("div");
          time.classList.add("time");
          time.textContent = res.sTime + "-" + res.eTime;
          
          const status = document.createElement("div");
          status.classList.add("status");
          status.textContent = res.bStatus;


          const b_id = document.createElement("div");
          b_id.classList.add("b_id");
          b_id.textContent =`#${res.b_id}`;
          const content = document.createElement("div");
          content.classList.add("content");
          content.textContent = `${res.eName} - ${res.name} - ${res.facilityType}`
      
          info.appendChild(time);
          info.appendChild(status);
          info.appendChild(b_id)
          info.appendChild(content);
          box.appendChild(info);

          const day = document.getElementById(id)!
    
          if (day) {
            day.getElementsByClassName("bContainer")[0].appendChild(box);
          }
              
          
        })
     
    };

    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });
    renderCalendar();
    
  
      
      

    
    if(localStorage.getItem("Access") == "1" || localStorage.getItem("Access") == "2"){
      document.getElementById("bRequest")!.style.display = "none";
    }
    document.getElementById("bRequest")!.addEventListener("click", () => {
      var bForm = document.getElementById("bookingForm")!;
      bForm.style.display = "block";
    })
    document.getElementById("filterBtn")!.addEventListener("click", () => {

      var fForm = document.getElementById("filterBookings")!;
      fForm.style.display = "block";
      
    })
   
    document.getElementById("submit")!.onclick = async function() {
      console.log(new Date().getTime())
        if (localStorage.getItem("Access") == "2" && (document.getElementById("submit")! as HTMLInputElement).value == "Approve"){
            const bApprove = {
              b_id: (document.getElementById("submit")! as HTMLInputElement).getAttribute("b_id"),
              token: localStorage.getItem("token"),
              type: "updateB"
            }
            ws.send(JSON.stringify(bApprove))
          }
        else{
          const bDate = document.getElementById("bDate") as HTMLInputElement;
          const sTime = document.getElementById("sTime") as HTMLInputElement;
          const eTime = document.getElementById("eTime") as HTMLInputElement;
          const eName = document.getElementById("eName") as HTMLInputElement;
          const eDesc = document.getElementById("eDesc") as HTMLInputElement;
          const remarks = document.getElementById("remarks") as HTMLInputElement;
          const facility = document.querySelector('#facilitiesContainer > .group.selected')!
          const bstatus = document.querySelector("#bStatus option:checked")!
          
    
          

          if (localStorage.getItem("Access") == "1" && (document.getElementById("submit")! as HTMLInputElement).value == "Edit"){
            //check for missing fields
            const facilityType = facility.getAttribute("facilityType") ?? "";
        
            const ubReq = {
              b_id: (document.getElementById("submit")! as HTMLInputElement).getAttribute("b_id"),
              bDate: bDate.value,
              sTime: sTime.value,
              eTime: eTime.value,
              eName: eName.value,
              eDesc: eDesc.value,
              remarks: remarks.value,
              facility: facility.id,
              facilityType: facilityType,
              bStatus:bstatus.textContent,
              type: "updateBooking",
              token:localStorage.getItem("Token")

            };
            ws.send(JSON.stringify(ubReq))
          }
          else{
            console.log(parseInt(sTime.value!.split(":")[0]) , parseInt(eTime.value!.split(":")[0] ) )
            if(bDate.value == "" || sTime.value == "" || eTime.value == "" || eName.value == "" || eDesc.value == "" || remarks.value == ""  ||facility == null){
              alert("Please fill in all fields");
              return;
            }
            if(sTime.valueAsDate!.getTime() > eTime.valueAsDate!.getTime()){
              alert("End Time must be after Start Time");
              return;
              
            }

            if(bDate.valueAsDate! < new Date(Date.now())){
              alert("Booking time must be in the future");
              return;
              
            }
 
            if(eTime.valueAsDate!.getTime() - sTime.valueAsDate!.getTime() < 900000){
              alert("Booking time must be at least 15 minutes");
              return;
            }
            if (sTime.value < "08:00" || eTime.value > "18:00"){ 
              alert("Booking time must be between 8am and 6pm");
              return;
            }
            alert("Booking Request Sent")
            var bForm = document.getElementById("bookingForm")!;
            bForm.style.display = "none";
            const facilityType = facility.getAttribute("facilityType") ?? "";
            const bReq = {
              b_id: Date.now().toString(),
              bDate: bDate.value,
              sTime: sTime.value,
              eTime: eTime.value,
              eName: eName.value,
              eDesc: eDesc.value,
              remarks: remarks.value,
              facility: facility.id,
              facilityType: facilityType,
              name: localStorage.getItem("Name") ?? "",
              bStatus: "PENDING"
            };
            const sbReq = {...bReq,token:localStorage.getItem("Token"),type: "booking"}
            ws.send(JSON.stringify(sbReq))
            allBookings.push(bReq)
          }
          
    
          
          
          
    
        }
    }

      var fForm = document.getElementById("filterBookings")!;
      var fColorsArr = Object.keys(fColors).map((key) => [key, fColors[key]]);
      fColorsArr.forEach((fc) => {
        const grp = document.createElement('div');
        grp.classList.add('group');


        const checkbox = document.createElement('input');
        checkbox.classList.add("filterColor") 
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = fc[0];
        checkbox.name = fc[0];
        checkbox.value = fc[1];
        checkbox.addEventListener("change", () => {
          console.log(checkbox.checked)
          
          if(checkbox.checked){
          
            filterColors.push(checkbox.value)
            console.log(filterColors)
          }
          else{
            filterColors.splice(filterColors.indexOf(checkbox.value), 1)
            console.log(filterColors)
          }
          Array.from(document.getElementById("days")!.getElementsByClassName("box")).forEach(b => {
            if(!(filterColors.includes((b as HTMLDivElement).style.backgroundColor))){
              (b as HTMLDivElement).style.display = "none"
            }
            else{
              (b as HTMLDivElement).style.display = "block"
            }
          })
          
        })

        const label = document.createElement('label');
        label.textContent = fc[0].replace("_"," ");


        const box = document.createElement('div');
        box.classList.add('box');
        box.style.backgroundColor = fc[1];

        grp.appendChild(checkbox);
        grp.appendChild(label);
        grp.appendChild(box);

        fForm.getElementsByClassName('content')[0].appendChild(grp);
      })


   


  
      
  }
  else if(window.document.location.pathname == '/equipment.html' || window.document.location.pathname == '/admin/equipment.html'){
    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {
        method: "POST",
        body: JSON.stringify({ type: "checkEquipment", token: localStorage.getItem("Token") }),
      }
    )
      .then(function (res) {
        

        if(!res.ok){
          console.log("YOU ARE NOT OK!")
        }
        return res.json();
      })
      .then(function (data: any) {
        console.log("CHECK",data)

        const dataObject = data.reduce((acc: any, item:any) => {
          acc[item.category] = item.count;
          return acc;
      },{} as Record<string, string>);
        const aInput = document.querySelectorAll('#rentingForm .container .amount')
        console.log(dataObject)
        aInput.forEach((element: Element) => {
            const amount = element as HTMLInputElement;
            amount.min = '0';
            amount.max = dataObject[amount.getAttribute("category")!]
            amount.parentElement!.getElementsByTagName("label")[0].textContent = ` (${dataObject[amount.getAttribute("category")!]}) Amount: `
     
            
        });
      })

    
    const daysContainer = document.getElementById("days")!;
    const nextBtn = document.getElementById("next")!;
    const prevBtn = document.getElementById("prev")!;
    const month = document.getElementById("month")!;

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

   
  
    const date = new Date();
    let currentMonth = date.getMonth();
    let currentYear = date.getFullYear();

    const renderCalendar = () => {
 
        daysContainer.textContent = ""
        date.setDate(1);
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const lastDayIndex = lastDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDay = new Date(currentYear, currentMonth, 0);
        const prevLastDayDate = prevLastDay.getDate();
        const nextDays = 7 - lastDayIndex - 1;

        month.innerHTML = `${months[currentMonth]} ${currentYear}`;

        for (let x = firstDay.getDay(); x > 0; x--) {
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth,2)}/${leadZero(prevLastDayDate - x + 1,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${prevLastDayDate - x + 1}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);

        }

        for (let i = 1; i <= lastDayDate; i++) {
          
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth+1,2)}/${leadZero(i,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${i}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);
          
        }

        for (let j = 1; j <= nextDays; j++) {
          const day = document.createElement("div");
          day.classList.add("day");
          day.id = `${leadZero(currentMonth+2,2)}/${leadZero(j,2)}`
          const dayLabel = document.createElement("span");
          dayLabel.textContent = `${j}`;
          day.appendChild(dayLabel);
          day.appendChild(document.createElement("br"));
          const bContainer = document.createElement("div");
          bContainer.classList.add("bContainer");
          day.appendChild(bContainer);
          daysContainer.appendChild(day);
        }
        console.log(allEquipments)
        allEquipments.forEach((equip) => {
          console.log(equip)
          equip.equipment.forEach((e) => {
            if(e.amount > 0){
              const box = document.createElement("div");

            box.classList.add("box"); 
            box.classList.add(equip.r_id)
            box.style.backgroundColor = eColors[e.name]

            if(localStorage.getItem("Access") == "2"){
              const epanel = document.getElementById("ePanel")!;
              epanel.getElementsByClassName('purpose')[0].textContent = equip.purpose;
            box.addEventListener("click", () => {
              epanel.style.display = "block";
            })
            epanel.setAttribute("r_id",equip.r_id);
            Array.from(epanel.getElementsByClassName("rJudgement")).forEach(btn => {
              if(equip.rstatus == "APPROVED"){
                btn.remove()
                const returnedBtn = document.createElement("button");
                returnedBtn.textContent = "Returned";
                epanel.appendChild(returnedBtn)
                returnedBtn.addEventListener("click", () => {
                  epanel.style.display = "none";
                  const uStatus = {
                    token:localStorage.getItem("Token"),
                    type:"updateEStatus",
                    r_id:equip.r_id,
                    status:"Returned"
                  }
                  ws.send(JSON.stringify(uStatus))
                })
              }
              else{
                btn.addEventListener("click", () => {
                  epanel.style.display = "none";
                  let choice = btn.textContent!;
                  const uStatus = {
                    token:localStorage.getItem("Token"),
                    type:"updateEStatus",
                    r_id:equip.r_id,
                    status:choice
                  }
                  ws.send(JSON.stringify(uStatus))
                  
                })
              }

              
            });

            }

            console.log(equip.rdate)
            const id = equip.rdate.split("-")[1] + "/" + equip.rdate.split("-")[2];
    
            const info = document.createElement("div");
            info.classList.add("info");
            
            const title = document.createElement("div");
            title.classList.add("title");
            title.textContent = e.name + " X" + e.amount;
            
            const status = document.createElement("div");
            status.classList.add("status");
            status.style.display = "float";
            status.textContent = equip.rstatus;


            const ddate = document.createElement("div");
            ddate.classList.add("ddate");
            ddate.textContent = `Due Date: ` + equip.ddate;
            


            const b_id = document.createElement("div");
            b_id.classList.add("b_id");
            b_id.textContent =`#${equip.r_id} - ${equip.name}`;
            info.appendChild(title);
            info.appendChild(status);
            info.appendChild(ddate);
            info.appendChild(b_id)
            box.appendChild(info);

            const day = document.getElementById(id)!
      
            if (day) {
              day.getElementsByClassName("bContainer")[0].appendChild(box);
            }
              
          
            }
            
          })
        })
       
     
    };

    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {
        method: "POST",
        body: JSON.stringify({ type: "allEquipment", token: localStorage.getItem("Token") }),
      }
    )
      .then(function (res) {
        if(!res.ok){
          console.log("YOU ARE NOT OK!")
        }
        return res.json();
      })
      .then(function (data: any) {
        
        data.forEach((el: any) => {
          console.log(el)
          allEquipments.push(el)
        })
        console.log(allEquipments)
        renderCalendar();
      })
      const microphone = document.querySelector('#rentingForm .container .group:nth-child(1) .amount') as HTMLInputElement;
      const ipad = document.querySelector('#rentingForm .container .group:nth-child(2) .amount') as HTMLInputElement;
      const laserpointer = document.querySelector('#rentingForm .container .group:nth-child(3) .amount') as HTMLInputElement;
      const videocamera = document.querySelector('#rentingForm .container .group:nth-child(4) .amount') as HTMLInputElement;

      microphone.addEventListener("keydown", preventInput)
      ipad.addEventListener("keydown", preventInput)
      laserpointer.addEventListener("keydown", preventInput)
      videocamera.addEventListener("keydown", preventInput)
  
    
    document.getElementById('submit')!.addEventListener('click', () => {

      const rDate = (document.getElementById("rDate") as HTMLInputElement);
      const dDate = (document.getElementById("dDate") as HTMLInputElement);
      const purpose = (document.getElementById("desc") as HTMLInputElement).value;
      
      const microphoneValue = parseInt(microphone?.value) || 0;
      const ipadValue = parseInt(ipad?.value) || 0;
      const laserpointerValue = parseInt(laserpointer?.value) || 0;
      const videocameraValue = parseInt(videocamera?.value) || 0;

      const hasEquipment = [microphoneValue, ipadValue, laserpointerValue, videocameraValue].some(v => v > 0);

      if(!rDate || !dDate || !purpose || !hasEquipment){
        alert("Missing Fields")
        return
      }

      if(rDate.valueAsDate! < new Date(Date.now()) || dDate.valueAsDate! < new Date(Date.now())){
        alert("Booking time must be in the future");
        return;
              
      }
      if(rDate > dDate){
        alert("Return Date cannot be before Rental Date")
        return
      }
      if (
        (microphoneValue < parseInt(microphone.min) || microphoneValue > parseInt(microphone.max)) ||
        (ipadValue < parseInt(ipad.min) || ipadValue > parseInt(ipad.max)) ||
        (laserpointerValue < parseInt(laserpointer.min) || laserpointerValue > parseInt(laserpointer.max)) ||
        (videocameraValue < parseInt(videocamera.min) || videocameraValue > parseInt(videocamera.max))
      ) {
        alert("Invalid amount of equipment");
        return
      }
      const eReq = {
        r_id: Date.now().toString(),
        rdate: rDate.value,
        ddate: dDate.value,
        purpose: purpose,
        equipment:[
          {name: 'microphone', amount: microphoneValue}, 
          {name: 'ipad', amount: ipadValue}, 
          {name: 'laserpointer', amount:  laserpointerValue}, 
          {name: 'videocamera', amount: videocameraValue}
        ],
        name:localStorage.getItem("Name")!,
        rstatus:"PENDING"
      }

      alert("Request sent. Please wait for approval")
      let rform = document.getElementById("rentingForm")!;
      rform.style.display = "none";

      ws.send(JSON.stringify({...eReq,token:localStorage.getItem("Token"),type: "equipment"}))
      allEquipments.push(eReq)
      console.log(allEquipments)
    });
      
      

    
    if(localStorage.getItem("Access") == "2"){
      document.getElementById("eRequest")!.style.display = "none";
      
    }
    if (localStorage.getItem("Access") == "1"){

      document.getElementById("statBtn")!.addEventListener("click", () => {

        var sForm = document.getElementById("stats")!;
        sForm.style.display = "block";
        const monthSelect = document.getElementById('monthSelector') as unknown as HTMLSelectElement;
        const index = new Date().getMonth();
        monthSelect.selectedIndex = index;
        renderChart(index)
      })
      
     

      document.getElementById('monthSelector')! .addEventListener("change", () => {
        const chartCanvas = document.getElementById("equipmentChart") as HTMLCanvasElement;
        const chart = Chart.getChart(chartCanvas); 
        if (chart) {
          chart.destroy(); 
        }
        renderChart((document.getElementById('monthSelector')! as unknown as HTMLSelectElement).selectedIndex)
      });

      function renderChart(month: number) {
        PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "equipmentStats",token:localStorage.getItem("Token"),year: new Date().getFullYear(),month: month+1}),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {
            
    
          console.log(data)
          const ctx = (document.getElementById('equipmentChart') as HTMLCanvasElement).getContext('2d')!;
          const categories = data.map((item: { category: string }) => item.category);
          const counts = data.map((item: { count: number }) => item.count);


          
          let performanceChart = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: categories,
                  datasets: [{
                      label: 'Total',
                      data: counts,
                      backgroundColor: [
                          'red',
                          'orange',
                          'yellow',
                          'green',

                      ],
                      borderColor: [
                          'red',
                          'orange',
                          'yellow',
                          'green',
                      ],
                      barThickness: 10,
                      borderWidth: 1
                  }]
              },
              options: {
                  
                  indexAxis: 'y',
                  
              }
          });
          
        })
      }
      


        
 
        
    }
    if(localStorage.getItem("Access") == "3"){
      document.getElementById("eRequest")!.addEventListener("click", () => {

        let rform = document.getElementById("rentingForm")!;
        rform.style.display = "block";
      })

    }

      var fForm = document.getElementById("filterRentals")!;
      document.getElementById("filterBtn")!.addEventListener("click", () => {


        fForm.style.display = "block";
        
      })

      var eColorsArr = Object.keys(eColors).map((key) => [key, eColors[key]]);
      eColorsArr.forEach((ec) => {
        const grp = document.createElement('div');
        grp.classList.add('group');


        const checkbox = document.createElement('input');
        checkbox.classList.add("filterColor") 
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = ec[0];
        checkbox.name = ec[0];
        checkbox.value = ec[1];
        checkbox.addEventListener("change", () => {
          console.log(checkbox.checked)
          
          if(checkbox.checked){
          
            filterColors.push(checkbox.value)
            console.log(filterColors)
          }
          else{
            filterColors.splice(filterColors.indexOf(checkbox.value), 1)
            console.log(filterColors)
          }
          Array.from(document.getElementById("days")!.getElementsByClassName("box")).forEach(b => {
            if(!(filterColors.includes((b as HTMLDivElement).style.backgroundColor))){
              (b as HTMLDivElement).style.display = "none"
            }
            else{
              (b as HTMLDivElement).style.display = "block"
            }
          })
          
        })

        const label = document.createElement('label');
        label.textContent = ec[0].replace("_"," ");


        const box = document.createElement('div');
        box.classList.add('box');
        box.style.backgroundColor = ec[1];

        grp.appendChild(checkbox);
        grp.appendChild(label);
        grp.appendChild(box);

        fForm.getElementsByClassName('content')[0].appendChild(grp);
      })

  }
  else if(window.document.location.pathname == '/admin/ticket.html'){
    
      PartySocket.fetch(
        {
          host: PARTYKIT_HOST,
          room: "global",
        },
        {

          method: "POST",
          body: JSON.stringify({ type: "aTickets",token:localStorage.getItem("Token")}),
        }
      ) .then(function(res) {
        if(!res.ok){
          console.log("YOU ARE NOT OK!")
        }
        return res.json();
      }).then(function(data : any) {
        data.tickets.forEach((el : any) => {
          const ticket = el;


          const row = document.createElement("tr");


          const req_id = document.createElement("td");
          req_id.textContent = ticket.request_id;
          row.appendChild(req_id);


          const room = document.createElement("td");
          room.textContent = ticket.classroom;
          row.appendChild(room);

          const desc = document.createElement("td");
          desc.textContent = ticket.dsc;
          row.appendChild(desc);

          const issues = document.createElement("td");

          issues.textContent = ticket.issues
          row.appendChild(issues);
          
          const priorityEl = document.createElement("td");
          priorityEl.textContent = priorities[ticket.priority.toString()]
          row.appendChild(priorityEl);
    
          const created_tsEl = document.createElement("td");
          created_tsEl.textContent = convertTime(ticket.created_ts)
          row.appendChild(created_tsEl);
    
          const end_tsEl = document.createElement("td");
          if(ticket.end_ts == null){
            end_tsEl.textContent = "N/A"
          }
          else{
            end_tsEl.textContent = convertTime(ticket.end_ts)
          }
          row.appendChild(end_tsEl);
      
          const status = document.createElement("td");
          status.textContent = ticket.rstatus
          row.appendChild(status);
          
          const edit = document.createElement("td");
          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.addEventListener("click", () => {
            if (editBtn.textContent == "Edit") {
              editBtn.disabled = true;
              setTimeout(() => {
                editBtn.disabled = false;
                editBtn.textContent = "Save";
              } , 2000);
              for (let i = 1; i < row.children.length-1; i++) {
        
                
                if (i==1 || i==2){
                  row.children[i].innerHTML = `<input type="text" value="${row.children[i].textContent}">`
                }
                if(i==3){
                

                  const selectProblems = document.createElement("select")
                  selectProblems.multiple = true
                  console.log(issues.textContent)
                  console.log(ticket.issues)
                  problems.forEach((el) => {
                    if(issues.textContent!.includes(el)){
                      console.log(el)
                      selectProblems.add(new Option(el, "selected"))
                    }
                    else{
                      selectProblems.add(new Option(el))
                    }

                  })
                  row.children[i].innerHTML = ``
                  row.children[i].appendChild(selectProblems)
                }
                if(i==4){
                  
                  row.children[i].innerHTML = ``
                  const selectPriority = document.createElement("select")
                  const prioritiesArr = [...Object.keys(priorities)]
                  const prioritiesArrValues = [...Object.values(priorities)]
                  prioritiesArr.forEach((el) => {
                    if(el == priorityEl.textContent){
                      selectPriority.add(new Option(prioritiesArrValues[prioritiesArr.indexOf(el)],el, true))
                      selectPriority.selectedIndex = prioritiesArr.indexOf(el); 
                    }
                    else{
                      selectPriority.add(new Option(prioritiesArrValues[prioritiesArr.indexOf(el)],el))
                    }
                  })
                  row.children[i].appendChild(selectPriority)
                  
                }
                if(i==5 || i==6){
                  const date = new Date(row.children[i].textContent ?? '');
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hour = String(date.getHours()).padStart(2, '0');
                  const minute = String(date.getMinutes()).padStart(2, '0');
                  const second = String(date.getSeconds()).padStart(2, '0');

                  const datetimeLocal = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
                  
                  row.children[i].innerHTML = `<input type="datetime-local" value="${datetimeLocal}">`
                }
        
                if(i==7){
                  const statuses = ["PENDING", "ACCEPTED", "COMPLETED"]
                  row.children[i].innerHTML = ``
                  const selectrStatus = document.createElement("select")
                  statuses.forEach((el) => {
                    if(el == status.textContent){
                      selectrStatus.add(new Option(el, "selected"))
                    }
                    else{
                      selectrStatus.add(new Option(el))
                    }
                  })
                  row.children[i].appendChild(selectrStatus)
                }
                
              }
            }
            if(editBtn.textContent == "Save"){
              editBtn.disabled = true;
              setTimeout(() => {
                editBtn.disabled = false;
                editBtn.textContent = "Edit";
              } , 2000);
              for (let i = 1; i < row.children.length-1; i++) {
        
                if(i == 4 || i== 7){
                  
                  const id = (row.children[i].querySelector("select option:checked") as HTMLOptionElement).value;
                  row.children[i].textContent = row.children[i].querySelector("select option:checked")!.textContent
                  if(id){
                    row.children[i].setAttribute("data_id", id)
                  }
                  

                }
                
                if (i==1 || i==2){
                  row.children[i].textContent = row.children[i].querySelector("input")!.value
                }
                if(i==3){
                  //get all options with value selected 
                  let checkedOptions = row.children[i].querySelectorAll("select option:checked")
                  if(checkedOptions.length == 0){
                    checkedOptions = row.children[i].querySelectorAll("option[value='selected']");
                    if(checkedOptions.length == 0){
                      alert("Please select atleast one problem")
                    }
                  }
                  

                
                  row.children[i].textContent = Array.from(checkedOptions).map(option => option.textContent).join(", ");
                }
                
                if(i==5 || i==6){
                  let time = convertTime(Date.parse(row.children[i].querySelector("input")!.value))
                  if(time == "Invalid Date"){
                    time = "N/A"
                  }
                  
                  row.children[i].textContent = time
                }
              
                
              }

              console.log(desc.textContent)
              console.log(row.children[3].textContent)
              const updateTicket = {
                type:"updateTicket",
                token: localStorage.getItem("Token"),
                req_id: req_id.textContent,
                room: room.textContent, 
                problems: issues.textContent,
                desc: desc.textContent,
                priority: priorityEl.getAttribute("data_id"),
                created_ts: created_tsEl.textContent,
                end_ts: end_tsEl.textContent,
                rstatus: status.textContent
              }
              console.log(updateTicket)
              ws.send(JSON.stringify(updateTicket))
    
            }
            
          })
          edit.appendChild(editBtn);
          row.appendChild(edit);



          const table = document.getElementById("tickets")!;
          table.appendChild(row);
          


       
        })
      });

      const month = (document.getElementById('month')! as unknown as HTMLSelectElement).selectedIndex = new Date().getMonth();
      renderChart(month)

      document.getElementById('month')! .addEventListener("change", () => {
        const chartCanvas = document.getElementById("performanceChart") as HTMLCanvasElement;
        const chart = Chart.getChart(chartCanvas); 
        if (chart) {
          chart.destroy(); 
        }
        renderChart((document.getElementById('month')! as unknown as HTMLSelectElement).selectedIndex)
      });

      function renderChart(month: number) {
        PartySocket.fetch(
          {
            host: PARTYKIT_HOST,
            room: "global",
          },
          {
    
            method: "POST",
            body: JSON.stringify({ type: "surveyResults",token:localStorage.getItem("Token"),year: new Date().getFullYear(),month: month+1}),
          }
        ) .then(function(res) {
          if(!res.ok){
            console.log("YOU ARE NOT OK!")
          }
          return res.json();
        }).then(function(data : any) {
            
    
          console.log(data)
          const ctx = (document.getElementById('performanceChart') as HTMLCanvasElement).getContext('2d')!;
       
            
          let performanceChart = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: ['Speed', 'Quality', 'Attitude'],
                  datasets: [{
                      label: 'Average Values',
                      data: [data[0].speed, data[0].quality, data[0].attitude],
                      backgroundColor: [
                          'rgba(255, 99, 132, 0.2)',
                          'rgba(54, 162, 235, 0.2)',
                          'rgba(255, 206, 86, 0.2)'
                      ],
                      borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)'
                      ],
                      barThickness: 100,
                      borderWidth: 1
                  }]
              },
              options: {
                  scales: {
                      y: {
                          beginAtZero: true
                      },
                  },
                  onClick: (event : ChartEvent) => {
                      const clickedElementIndex = performanceChart.getElementsAtEventForMode(event.native ?? {} as Event, 'nearest', { intersect: true }, true);
                      if (clickedElementIndex?.length) {
                          const index = clickedElementIndex[0].index;
                          const categories = ['speed', 'quality', 'attitude'];
                          const category = categories[index];
                          console.log(category)
                          handleBarClick(category);
                      }
                  }
              }
          });
        })
      }
      


        async function handleBarClick(category : string) {
            const monthSelect = document.getElementById('month') as unknown as HTMLSelectElement;
            const month = parseInt(monthSelect.value, 10);
            PartySocket.fetch(
              {
                host: PARTYKIT_HOST,
                room: "global",
              },
              {
        
                method: "POST",
                body: JSON.stringify({ type: "staffRanking",token:localStorage.getItem("Token"),category: category,month: month,year: new Date().getFullYear(),order:"DESC"}),
              }
            ) .then(function(res) {
              if(!res.ok){
                console.log("YOU ARE NOT OK!")
              }
              return res.json();
            }).then(function(data : any) {
              console.log(data)
              const staffContainer = document.getElementById('staffContainer')!;
              staffContainer.innerHTML = '';
              staffContainer.parentElement!.getElementsByClassName("title")[0].textContent = `Top 5 staff in ${category}`
              if (data.length == 0) {
                  staffContainer.innerHTML = '<p>No staff found.</p>';
                  return;
              }
              const list = document.createElement('ul');
              for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const listItem = document.createElement('li');
                listItem.textContent = `${i + 1}. ${item.name}:${parseFloat(item.averagevalue).toFixed(2)}`;
                list.appendChild(listItem);
              }
              staffContainer.appendChild(list);
            })
        }


      
  }
  else if(window.document.location.pathname == '/admin/user.html'){

    const staffContainer = document.getElementById('staff_info')!.getElementsByClassName('container')[0]!;
    staffContainer.getElementsByClassName("Edit")[0].addEventListener("click", () => {
      const name = (staffContainer.getElementsByClassName('name')[0] as unknown as HTMLSelectElement).value;
      const role = (staffContainer.getElementsByClassName('role')[0] as unknown as HTMLSelectElement).value;
      const email = (staffContainer.getElementsByClassName('email')[0] as HTMLInputElement).value;
      const phone = (staffContainer.getElementsByClassName('phone')[0] as HTMLInputElement).value;
      const passw = (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).value;
      const roleToAccess = Object.entries(accesstoRole).reduce((acc : any, [key, value]) => {
        acc[value] = key;
        return acc;
      }, {});
      const editMessage  = {
        type:"aEditProfile",
        name: name,
        access: roleToAccess[role],
        email_address: email,
        phone_number: phone,
        passw: passw,
        token: localStorage.getItem("Token")

      }

      PartySocket.fetch(
        {
          host: PARTYKIT_HOST,
          room: "global",
        },
        {

          method: "POST",
          body: JSON.stringify(editMessage),
        }
      ).then(function(res) {
        if(!res.ok){
          console.log("YOU ARE NOT OK!")
        }
        alert("Profile Updated")
      })
    })
    let last_id = '0'
    PartySocket.fetch(
      {
        host: PARTYKIT_HOST,
        room: "global",
      },
      {

        method: "POST",
        body: JSON.stringify({ type: "aStaff",token: localStorage.getItem("Token")}),
      }
    ).then(function(res) {
      if(!res.ok){
        console.log("YOU ARE NOT OK!")
      }
      return res.json();
    })
    .then(function(data : any) {
      data.forEach((staff : any ,index : number) => {
        if(staff.id != "0"){
          staffContainer.getElementsByClassName('name')[0].appendChild(new Option(staff.name, staff.id))
        }
        if (index == data.length - 1) {
          last_id = staff.id
        }
        
      })
    })
    
    const accesstoRoleArr = [...Object.keys(priorities)]
    const accesstoRoleArrValues = [...Object.values(priorities)]
    accesstoRoleArrValues.forEach((el:any)=> {
      document.getElementsByClassName('role')[0].appendChild(new Option(el, accesstoRoleArr[accesstoRoleArrValues.indexOf(el)]))
      document.getElementsByClassName('role')[1].appendChild(new Option(el, accesstoRoleArr[accesstoRoleArrValues.indexOf(el)]))

    })


    const addStaffContainer = document.getElementById('staff_info')!.getElementsByClassName('container')[1]!;
    addStaffContainer.getElementsByClassName("Add")[0].addEventListener("click", () => {
      const fname = (addStaffContainer.getElementsByClassName('fname')[0] as HTMLInputElement).value 
      const lname = (addStaffContainer.getElementsByClassName('lname')[0] as HTMLInputElement).value;
      const gender = (addStaffContainer.querySelector('input[name="gender"]:checked') as HTMLInputElement).value;
      const role = (staffContainer.getElementsByClassName('role')[0] as unknown as HTMLSelectElement).value;
      const email = (staffContainer.getElementsByClassName('email')[0] as HTMLInputElement).value;
      const phone = (staffContainer.getElementsByClassName('phone')[0] as HTMLInputElement).value;
      const passw = (staffContainer.getElementsByClassName('password')[0] as HTMLInputElement).value;
      const roleToAccess = Object.entries(accesstoRole).reduce((acc : any, [key, value]) => {
        acc[value] = key;
        return acc;
      }, {});
      const addMessage  = {
        type:"addStaff",
        id:last_id+1,
        fname: fname,
        lname: lname,
        gender: gender,
        access: roleToAccess[role],
        email_address: email,
        phone_number: phone,
        passw: passw,
        
        token: localStorage.getItem("Token")

      }

      PartySocket.fetch(
        {
          host: PARTYKIT_HOST,
          room: "global",
        },
        {

          method: "POST",
          body: JSON.stringify(addMessage),
        }
      ).then(function(res) {
        if(!res.ok){
          console.log("YOU ARE NOT OK!")
        }
        alert("Profile Updated")
      })
    })


  }
  
})

ws.addEventListener("message", (message : any) => {
  

  const parsedMessage = JSON.parse(message.data)
  if(parsedMessage.type == "updateTicket"){
    const tickets = document.getElementById("tickets")!;
    const res = JSON.parse(message.data)
    
    let tr,td,txtValue,i;
    tr = tickets.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
    
      td = tr[i].getElementsByTagName("td")[0];

      if (td) {
        txtValue = td.textContent || td.innerText;

        if(txtValue == res.req_id){
          
          if(localStorage.getItem("Access") == "2"){
            /*
            const updateTicket = {
              type:"updateTicket",
              token: localStorage.getItem("Token"),
              req_id: req_id.textContent,
              staff: staff.textContent,
              room: room.textContent, 
              problems: issues.textContent,
              desc: desc.textContent,
              priority: priorityEl.textContent,
              created_ts: created_tsEl.textContent,
              end_ts: end_tsEl.textContent,
              technician_el: technician_el.textContent,
              rstatus: status.textContent
            }
            */
            tr[i].children[2].textContent = res.room
            tr[i].children[3].textContent = res.desc
            tr[i].children[4].textContent = res.problems
            tr[i].children[5].textContent = priorities[res.priority]
            tr[i].children[6].textContent = res.created_ts
            tr[i].children[7].textContent = res.end_ts
            tr[i].children[8].textContent = res.rstatus

          }
          if(localStorage.getItem("Access") == "3"){
            
           
            tr[i].children[1].textContent = res.room
            tr[i].children[2].textContent = res.desc
            tr[i].children[3].textContent = res.problems
            tr[i].children[4].textContent = priorities[res.priority]
            tr[i].children[5].textContent = res.created_ts
            tr[i].children[6].textContent = res.end_ts  
            tr[i].children[8].textContent = res.rstatus

          }
        } 
      }       
    }
  }
  else if(parsedMessage.type == "updateBooking"){ 
    const res = JSON.parse(message.data)
    const box = document.getElementById(res.b_id);
    if(box){
      box.style.backgroundColor = fColors[res.facilityType]
      box.innerHTML = ``
      //MIGHT CAUSE ERROR DUE TO MULTIPLE CLICK EVENT LISTENER

      box.addEventListener("click", () => {
        var bForm = document.getElementById("bookingForm")!;
        bForm.style.display = "block";
        const bDate = document.getElementById("bDate") as HTMLInputElement;
        const sTime = document.getElementById("sTime") as HTMLInputElement;
        const eTime = document.getElementById("eTime") as HTMLInputElement;
        const eName = document.getElementById("eName") as HTMLInputElement;
        const eDesc = document.getElementById("eDesc") as HTMLInputElement;
        const remarks = document.getElementById("remarks") as HTMLInputElement;
        bDate.value = res.bDate;
        sTime.value = res.sTime;
        eTime.value = res.eTime;
        eName.value = res.eName;
        eDesc.value = res.eDesc;
        remarks.value = res.remarks;
        const roomBtns = document.getElementsByClassName("roomBtn")

        for (let i = 0; i < roomBtns.length; i++) {
          if(roomBtns[i].textContent == res.facilityType.replace("_"," ")){
            (roomBtns[i] as HTMLButtonElement).click();
            break;
          }
        }
        const facility = document.getElementById(res.facility)
        facility?.classList.add("selected")

        const submit = document.getElementById("submit")! as HTMLInputElement;


        if(localStorage.getItem("Access") == "2"){
          submit.value = "Approve"
          submit.setAttribute("b_id", res.b_id)
        }

      })

      const id = res.bDate.split("-")[1] + "/" + res.bDate.split("-")[2];

      const info = document.createElement("div");
      info.classList.add("info");
      
      const time = document.createElement("div");
      time.classList.add("time");
      time.textContent = res.sTime + "-" + res.eTime;
      
      const status = document.createElement("div");
      status.classList.add("status");
      status.textContent = res.bStatus;


      const b_id = document.createElement("div");
      b_id.classList.add("b_id");
      b_id.textContent =`#${res.b_id}`;
      const content = document.createElement("div");
      content.classList.add("content");
      content.textContent = `${res.eName} - ${res.staff_name} - ${res.facilityType}`
    
      info.appendChild(time);
      info.appendChild(status);
      info.appendChild(b_id)
      info.appendChild(content);
      box.appendChild(info);

    }
  }
    
  
  else{
    if(window.document.location.pathname == '/support.html'){ 

      const ticket = parsedMessage
  
      const row = document.createElement("tr");
  
  
      const req_id_el = document.createElement("td");
      req_id_el.textContent = ticket.req_id
      row.appendChild(req_id_el);
  
      const staff_el = document.createElement("td");
      staff_el.textContent = ticket.name
      row.appendChild(staff_el);
  
      const classroom = document.createElement("td");
      classroom.textContent = ticket.room
      row.appendChild(classroom);
  
      const description = document.createElement("td");
      description.textContent = ticket.desc
      row.appendChild(description);
  
      const problems = document.createElement("td");
      problems.textContent = ticket.problems.join(", ")
      row.appendChild(problems);
  
      const priorityEl = document.createElement("td");
      priorityEl.textContent = priorities[ticket.priority]
      row.appendChild(priorityEl);
  
      const created_tsEl = document.createElement("td");
      created_tsEl.textContent = convertTime(ticket.created_ts)
      row.appendChild(created_tsEl);
  
      const end_tsEl = document.createElement("td");
      end_tsEl.textContent = 'N/A'
      row.appendChild(end_tsEl);
  
  
  
      const status = document.createElement("td");
      status.textContent = ticket.rStatus
      row.appendChild(status);
  
  
  
      const action = document.createElement("td");
      const aBtn = document.createElement("button");
  
      if (ticket.rStatus == "PENDING"){
        aBtn.textContent = "Accept";
      
      }
      else if(ticket.rStatus == "ACCEPTED"){
        aBtn.textContent = "Complete";
      }
  
      aBtn.addEventListener("click", () => {
  
        if(aBtn.textContent == "Accept"){
       
          const acceptMessage  = {
            type:"update",
            update:"accept",
            name:localStorage.getItem("Name"),
            token: localStorage.getItem("Token"),
            req_id: ticket.req_id
          }
          ws.send(JSON.stringify(acceptMessage))
          status.textContent = "ACCEPTED"
          aBtn.textContent = "Complete"
          aBtn.disabled = true;
          setTimeout(() => {
            aBtn.disabled = false;
          } , 1000);
        }
        else if(aBtn.textContent == "Complete"){
          const completeMessage  = {
            type:"update",
            update:"complete",
            name:localStorage.getItem("Name"),
            token: localStorage.getItem("Token"),
            req_id: ticket.req_id
          }
          ws.send(JSON.stringify(completeMessage))
          status.textContent = "COMPLETED"
          aBtn.remove()
        }
       
        
        
  
      })
  
  
     
      action.appendChild(aBtn);
      
      row.appendChild(action);
  
      const table = document.getElementById("tickets")!;
      table.appendChild(row);
  
  
  
    }
    if(window.document.location.pathname == '/ticket.html'){
    
      const res = parsedMessage
  
      if (res.type == "updated"){
      
    
          const tickets = document.getElementById("tickets")!;
      
          let tr,td,txtValue,i;
          tr = tickets.getElementsByTagName("tr");
          for (i = 0; i < tr.length; i++) {
         
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
              txtValue = td.textContent || td.innerText;
              if(txtValue == res.req_id){
                if (res.update == "accepted"){
                  
                tr[i].getElementsByTagName("td")[8].textContent = "ACCEPTED";
                tr[i].getElementsByTagName("td")[7].textContent = res.name;
                }
                else if(res.update == "completed"){
                  tr[i].getElementsByTagName("td")[8].textContent = "COMPLETED";
                  tr[i].getElementsByTagName("td")[6].textContent = convertTime(Date.now())
                  const surveyButton = document.createElement("button")
                  surveyButton.addEventListener("click", () => {
                    document.getElementById("survey")!.style.display = "block";
                    document.getElementById("survey")!.setAttribute("req_id",res.req_id);
                  })
                  surveyButton.id = 'takeSurvey'

                  surveyButton.textContent = "Take Survey"
  
                  tr[i].appendChild(surveyButton)
                }
              } 
            }         
          }
  
      }
  
      
    }
    if(window.document.location.pathname == '/booking.html'){
      const res = parsedMessage
      if(res.type == "booking"){
        const rK: string = 'type';
        delete res[rK];
        allBookings.push(res)
        const box = document.createElement("div");
        box.id = res.b_id;
        box.classList.add("box");
        box.style.backgroundColor = fColors[res.facilityType]
  
        box.addEventListener("click", () => {
          var bForm = document.getElementById("bookingForm")!;
          bForm.style.display = "block";
          const bDate = document.getElementById("bDate") as HTMLInputElement;
          const sTime = document.getElementById("sTime") as HTMLInputElement;
          const eTime = document.getElementById("eTime") as HTMLInputElement;
          const eName = document.getElementById("eName") as HTMLInputElement;
          const eDesc = document.getElementById("eDesc") as HTMLInputElement;
          const remarks = document.getElementById("remarks") as HTMLInputElement;
          bDate.value = res.bDate;
          sTime.value = res.sTime;
          eTime.value = res.eTime;
          eName.value = res.eName;
          eDesc.value = res.eDesc;
          remarks.value = res.remarks;
          const roomBtns = document.getElementsByClassName("roomBtn")
  
          for (let i = 0; i < roomBtns.length; i++) {
            if(roomBtns[i].textContent == res.facilityType.replace("_"," ")){
              (roomBtns[i] as HTMLButtonElement).click();
              break;
            }
          }
          const facility = document.getElementById(res.facility)
          facility?.classList.add("selected")
  
          const submit = document.getElementById("submit")! as HTMLInputElement;
  
  
          if(localStorage.getItem("Access") == "2"){
            submit.value = "Approve"
            submit.setAttribute("b_id", res.b_id)
          }
  
        })
  
        const id = res.bDate.split("-")[1] + "/" + res.bDate.split("-")[2];
  
        const info = document.createElement("div");
        info.classList.add("info");
        
        const time = document.createElement("div");
        time.classList.add("time");
        time.textContent = res.sTime + "-" + res.eTime;
        
        const status = document.createElement("div");
        status.classList.add("status");
        status.textContent = res.bStatus;
  
  
        const b_id = document.createElement("div");
        b_id.classList.add("b_id");
        b_id.textContent =`#${res.b_id}`;
        const content = document.createElement("div");
        content.classList.add("content");
        content.textContent = `${res.eName} - ${res.name} - ${res.facilityType}`
     
        info.appendChild(time);
        info.appendChild(status);
        info.appendChild(b_id)
        info.appendChild(content);
        box.appendChild(info);
  
        const day = document.getElementById(id)!
     
        if (day) {
          day.getElementsByClassName("bContainer")[0].appendChild(box);
        }
  
        
    
  
      }
      if(res.type == "error"){
        alert(res.status)
      }
      if(res.type == "updateB"){
        const box = document.getElementById(res.b_id);
        if(box){
          box.getElementsByClassName("info")[0].getElementsByClassName("status")[0].textContent = res.bStatus
        }
      }
  
    }
    if(window.document.location.pathname == '/equipment.html'){

      const res = parsedMessage
      console.log(res)
      if (res.type == "equipment") {
        res.equipment.forEach((e:any) => {
          if(e.amount > 0){
            const box = document.createElement("div");
          

          box.classList.add("box"); 
          box.classList.add(res.r_id);
          box.style.backgroundColor = eColors[e.name]

          if(localStorage.getItem("Access") == "2"){

            const epanel = document.getElementById("ePanel")!;
            box.addEventListener("click", () => {
              epanel.style.display = "block";
            })
            epanel.setAttribute("r_id",res.r_id);
            Array.from(epanel.getElementsByClassName("rJudgement")).forEach(btn => {
              
            });

          }


          const id = res.rdate.split("-")[1] + "/" + res.rdate.split("-")[2];
  
          const info = document.createElement("div");
          info.classList.add("info");
          
          const title = document.createElement("div");
          title.classList.add("title");
          title.textContent = e.name + " X" + e.amount;
          
          const status = document.createElement("div");
          status.classList.add("status");
          status.textContent = res.rstatus;


          const ddate = document.createElement("div");
          ddate.classList.add("ddate");
          ddate.textContent = `Due Date: ` + res.ddate;
          


          const b_id = document.createElement("div");
          b_id.classList.add("b_id");
          b_id.textContent =`#${res.r_id} - ${res.name}`;
          info.appendChild(title);
          info.appendChild(status);
          info.appendChild(ddate);
          info.appendChild(b_id)
          box.appendChild(info);

          const day = document.getElementById(id)!
    
          if (day) {
            day.getElementsByClassName("bContainer")[0].appendChild(box);
          }
            
        
          }
          
        })
      }
      if (res.type == "updateEStatus") {
        const boxes = document.getElementsByClassName(res.r_id);
        if (boxes) {
          Array.from(boxes).forEach(box => {
            const statusElement = box.querySelector(".info .status");
            if (statusElement) {
              statusElement.textContent = res.bStatus;
            }
          });
        } 
      }


    }
  }

  
  

});

ws.addEventListener("error", () => {
  console.log("error");
});