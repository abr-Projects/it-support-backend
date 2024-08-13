import "./styles.css";

import PartySocket from "partysocket";

declare const PARTYKIT_HOST: string;

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

let allBookings: Booking[] = [];
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
          image: "assets/art1"
      },
      {
          id: "2",
          name: "Arts Room 2",
          image: "assets/art2"
      }
  ],
  "Music Rooms": [
      {
          id: "3",
          name: "Music Room 1",
          image: "assets/music1"
      },
      {
          id: "4",
          name: "Music Room 2",
          image: "assets/music2"
      }
  ],
  "Computer Rooms": [
      {
          id: "5",
          name: "Computer Room 1",
          image: "assets/computer1"
      },
      {
          id: "6",
          name: "Computer Room 2",
          image: "assets/computer2"
      }
  ],
  "Meeting Rooms": [
      {
          id: "9",
          name: "Meeting Room 1",
          image: "assets/meeting1"
      },
      {
          id: "10",
          name: "Meeting Room 2",
          image: "assets/meeting2"
      }
  ],
  "Sport Playgrounds": [
      {
          id: "11",
          name: "Swimming Pool",
          image: "assets/pool"
      },
      {
          id: "12",
          name: "Track and Field",
          image: "assets/track"
      },
      {
          id: "13",
          name: "Soccer Field",
          image: "assets/soccer"
      },
      {
          id: "14",
          name: "Basketball Court",
          image: "assets/basketball"
      }
  ],
  "Hall": [
      {
          id: "7",
          name: "Hall 1",
          image: "assets/hall1"
      },
      {
          id: "8",
          name: "Hall 2",
          image: "assets/hall2"
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


const priorities: { [key: string]: string } = {
  '1': 'Low',
  '2': 'Medium',
  '3': 'High',


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

  if (key === 'Backspace') {
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



window.document.addEventListener("DOMContentLoaded",function(){

  Array.from(document.getElementsByClassName("close")).forEach(btn => {
    btn.addEventListener("click", () => {
      const parentElement = btn.parentElement?.parentElement;
      if (parentElement) {
        parentElement.style.display = "none";
      }
    })
  });
  
  const tickets = document.getElementById("tickets");
  if (tickets) {
  const tr = tickets.getElementsByTagName("tr");
  
  let th = tr[0].getElementsByTagName("th")

  const filter = document.getElementById("filter")!;

  for (let i = 0; i < th.length; i++) {


    if(th[i].textContent == "Action" || th[i].textContent == "Survey") continue

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
          temp = data
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
          else if(localStorage.getItem("Access") === "1"){
            window.location.assign('/admin/ticket.html')

          }
        })    
    };
  }
  else if(window.document.location.pathname == '/ticket.html'){
    if (localStorage.getItem("Access") === null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") === "2"){
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
          created_tsEl.textContent = convertTime(ticket.created_ts)
          row.appendChild(created_tsEl);
    
          const end_tsEl = document.createElement("td");
          end_tsEl.textContent = 'N/A'
          row.appendChild(end_tsEl);

          const technician_el = document.createElement("td");
          technician_el.textContent = 'N/A'
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
      const room = (<HTMLInputElement>document.getElementById("room")).value
      const desc = (<HTMLTextAreaElement>document.getElementById("description")).value
      const priority = document.getElementById("priority") as HTMLSelectElement | null;
      
      let sProb: string[] = [];
      let checkboxes = document.getElementsByName('problems') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((el: HTMLInputElement) => {
        if (el.checked) {
          sProb.push(el.value);
        }
      });
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
    if (localStorage.getItem("Access") === null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") === "3"){
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
  else if(window.document.location.pathname == '/booking.html'){
    if (localStorage.getItem("Access") === null){
      window.location.assign('/')
    }
    if (localStorage.getItem("Access") === "2"){
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
          
          bDate.value = bDateV;
          sTime.value = res.start_time.split(" ")[1].split(":")[0] + ":" + res.start_time.split(" ")[1].split(":")[1];
          eTime.value = res.end_time.split(" ")[1].split(":")[0] + ":" + res.end_time.split(" ")[1].split(":")[1];
          eName.value = res.event_name;
          eDesc.value = res.event_description;
          remarks.value = res.remarks;
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
            submit.classList.add(res.booking_id)
          }
        })

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
              group.classList.add(fName.replace(" ","_"));
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
              submit.classList.add(res.b_id)
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
    
  
      
      

    document.getElementById("mybookingsBtn")!.addEventListener("click", () => {
      const box = document.createElement("div");
      box.classList.add("box");
      box.style.backgroundColor = "orange"
      const info = document.createElement("div");
      info.classList.add("info");
      
      const time = document.createElement("div");
      time.classList.add("time");
      time.textContent = "08:00 - 09:00";
      
      const status = document.createElement("div");
      status.classList.add("status");
      status.textContent = "PENDING";
      const b_id = document.createElement("div");
      b_id.classList.add("b_id");
      b_id.textContent =`#1722737451408`;

      const content = document.createElement("div");
      content.classList.add("content");
      content.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam, voluptatem.";
      
      info.appendChild(time);
      info.appendChild(status);
      info.appendChild(b_id);
      info.appendChild(content);
      box.appendChild(info);
      document.getElementById("days")!.getElementsByClassName("day")[7].getElementsByClassName("bContainer")[0].appendChild(box);
    })
    document.getElementById("bRequest")!.addEventListener("click", () => {
      var bForm = document.getElementById("bookingForm")!;
      bForm.style.display = "block";
    })
    document.getElementById("filterBtn")!.addEventListener("click", () => {

      var fForm = document.getElementById("filterBookings")!;
      fForm.style.display = "block";
      
    })
    document.getElementById("submitSurvey")!.onclick = async function() {

      const speed = Array.from(document.getElementsByName("rSpeed") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const quality = Array.from(document.getElementsByName("rQuality") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const attitude = Array.from(document.getElementsByName("rAttitude") as NodeListOf<HTMLInputElement>).find((r: HTMLInputElement) => r.checked)!.value;
      const comment = (document.getElementById("comment") as HTMLTextAreaElement).value;

      const survey = {
        type: "survey",
        req_id: document.getElementById("submitSurvey")!.classList[1],
        
        speed: speed,
        quality: quality,
        attitude: attitude,
        
        comment: comment
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
        return res.json();
      }).then(function(data : any) {

        alert("Thank you for your feedback!")
      })

      
    }
    document.getElementById("submit")!.onclick = async function() {
      if (localStorage.getItem("Access") == "2" && (document.getElementById("submit")! as HTMLInputElement).value == "Approve"){
        const bApprove = {
          b_id: (document.getElementById("submit")! as HTMLInputElement).classList[0],
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
  
        const bReq = {
          b_id: Date.now().toString(),
          bDate: bDate.value,
          sTime: sTime.value,
          eTime: eTime.value,
          eName: eName.value,
          eDesc: eDesc.value,
          remarks: remarks.value,
          facility: facility.id,
          facilityType: facility.classList[1],
          name: localStorage.getItem("Name") ?? "",
          bStatus: "PENDING"
        };
        const sbReq = {...bReq,token:localStorage.getItem("Token"),type: "booking"}
        ws.send(JSON.stringify(sbReq))
        allBookings.push(bReq)
        
  
        
        
        
  
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

          const staff = document.createElement("td");
          staff.textContent = ticket.name;
          staff.id = ticket.staff_id;
          row.appendChild(staff);


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

          const technician_el = document.createElement("td");
          console.log(ticket.technician_id)
          if(ticket.technician_id == 0){
            technician_el.textContent = "N/A"
          }
          else{
            technician_el.textContent = data.staff.find(({ id }: any) => id === ticket.technician_id).name ?? "N/A";
          }
          
          
            
          
          row.appendChild(technician_el);
    
      
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
        
                if(i==1){
                  row.children[i].innerHTML = ``
                  const selectStaff= document.createElement("select")
                  data.staff.forEach((el : any) => {
                    if(el.access == "3"){
                      if(el.name == ticket.name){
                        selectStaff.add(new Option(el.name, "selected"))
                      }
                      else{
                        selectStaff.add(new Option(el.name))
                      }
                    }
             
                    
                    
                  })
                  row.children[i].appendChild(selectStaff)
                }
                if (i==2 || i==3){
                  row.children[i].innerHTML = `<input type="text" value="${row.children[i].textContent}">`
                }
                if(i==4){
                  row.children[i].innerHTML = ``
                  const selectProblems = document.createElement("select")
                  selectProblems.multiple = true
                  problems.forEach((el) => {
                    if(ticket.issues.includes(el)){
                      selectProblems.add(new Option(el, "selected"))
                    }
                    else{
                      selectProblems.add(new Option(el))
                    }

                  })
                  row.children[i].appendChild(selectProblems)
                }
                if(i==5){
                  row.children[i].innerHTML = ``
                  const selectPriority = document.createElement("select")
                  const prioritiesArr = [...Object.values(priorities)]
                  prioritiesArr.forEach((el) => {
                    if(el == ticket.priority){
                      selectPriority.add(new Option(el, "selected"))
                    }
                    else{
                      selectPriority.add(new Option(el))
                    }
                  })
                  row.children[i].appendChild(selectPriority)
                  
                }
                if(i==6 || i==7){
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
                if(i==8){
                  row.children[i].innerHTML = ``
                  const selectTechnicians = document.createElement("select")
                  data.staff.forEach((el : any) => {
                    if(el.access == "2"){
                      if(el.name == ticket.technician){
                        selectTechnicians.add(new Option(el.name, "selected"))
                      }
                      else{
                        selectTechnicians.add(new Option(el.name))
                      }
                    }
               
                  })
                  row.children[i].appendChild(selectTechnicians)
                }
                if(i==9){
                  const statuses = ["PENDING", "ACCEPTED", "COMPLETED"]
                  row.children[i].innerHTML = ``
                  const selectrStatus = document.createElement("select")
                  statuses.forEach((el) => {
                    if(el == ticket.rstatus){
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
              console.log('SAVE')
              for (let i = 1; i < row.children.length-1; i++) {
        
                if(i==1 || i ==5 ||i == 8 || i==9){
                  
                
                  row.children[i].textContent = row.children[i].querySelector("select option:checked")!.textContent
                  

                }
                
                if (i==2 || i==3){
                  row.children[i].textContent = row.children[i].querySelector("input")!.value
                }
                if(i==4){
                  //get all options with value selected 
                  let checkedOptions = row.children[i].querySelectorAll("select option:checked")
                  if(checkedOptions.length == 0){
                    checkedOptions = row.children[i].querySelectorAll("option[value='selected']");
                  }
                  

                
                  row.children[i].textContent = Array.from(checkedOptions).map(option => option.textContent).join(", ");
                }
                
                if(i==6 || i==7){
                  row.children[i].textContent = convertTime(Date.parse(row.children[i].querySelector("input")!.value))
                }
              
                
              }
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

              ws.send(JSON.stringify(updateTicket))

                
              

              
          
            }
            
          })
          edit.appendChild(editBtn);
          row.appendChild(edit);



          const table = document.getElementById("tickets")!;
          table.appendChild(row);
          


       
      })
    })

  }
})

ws.addEventListener("message", (message : any) => {

  if(JSON.parse(message.data).admin == true){

    if(JSON.parse(message.data).type == "updateTicket"){
      const tickets = document.getElementById("tickets")!;
      const res = JSON.parse(message.data)
      
      let tr,td,txtValue,i;
      tr = tickets.getElementsByTagName("tr");
      for (i = 0; i < tr.length; i++) {
     
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if(txtValue == res.req_id){
            if(localStorage.getItem("Access") == "2"){}
            if(localStorage.getItem("Access") == "2"){}
          } 
        }       
      }
    }
    
  }
  else{
    if(window.document.location.pathname == '/support.html'){ 

      const ticket = JSON.parse(message.data)
  
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
    
      const res = JSON.parse(message.data)
  
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
                    document.getElementById("survey")!.classList.add(res.req_id);
                  })
  
                  tr[i].getElementsByTagName("td")[9].appendChild(surveyButton)
                }
              } 
            }       
          }
  
      }
  
      
    }
    if(window.document.location.pathname == '/booking.html'){
      const res = JSON.parse(message.data)
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
            submit.classList.add(res.b_id)
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
  }

  
  

});