import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { Analytics } from "@vercel/analytics/react";

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════
const SCHOOL = {
  name: "The Nyaga Kindiki Schools", location: "Tharaka North District, Tharaka Nithi County",
  address: "Gaciongo-Mukothima Road, Meru-Mukothima Road", poBox: "P.O Box 2511-60200, Meru – Kenya",
  phone: "+254 722 679747 / +254 720 537265", email: "thenyagakindikischools@gmail.com",
  motto: "Education Liberates", vision: "A model school with the best practices in the region and beyond",
  website: "nyagakindikischools.sc.ke", founded: "7th January 2015",
};
const ALL_CLASSES = ["PP1","PP2","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9"];
const TERMS = ["Term 1","Term 2","Term 3"];
const EXAM_TYPES = ["Opener Exam","Midterm Exam","End Term Exam"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const CC = ["#1d4ed8","#15803d","#b45309","#b91c1c","#7c3aed","#0e7490","#be185d","#065f46","#0284c7","#9333ea"];
const SUBJECTS_MAP = {
  PP: ["Language Activities","Mathematical Activities","Environmental Activities","Creative Activities","Religious Education Activities"],
  Lower: ["English Language Activities","Kiswahili Language Activities","Mathematical Activities","Environmental Activities","Religious Education Activities","Creative Activities","Indigenous Language Activities"],
  Upper: ["English","Kiswahili","Mathematics","Integrated Science","Social Studies","Religious Education (CRE/IRE)","Agriculture and Nutrition","Creative Arts and Sports"],
  JSS: ["English","Kiswahili","Mathematics","Integrated Science","Social Studies","Pre-Technical and Pre-Career Studies","Agriculture and Nutrition","Religious Education (CRE/IRE)","Creative Arts and Sports"],
};
const DUTY_TYPES = ["Morning Duty","Gate Duty","Lunch Duty","Preps Supervision","Evening Duty","Exam Supervision","Games Supervision","Library Duty","Dining Hall Duty"];
const COUNCIL_POSITIONS = ["Head Boy","Head Girl","Deputy Head Boy","Deputy Head Girl","Games Captain (Boys)","Games Captain (Girls)","Secretary","Treasurer","Environment Prefect","Discipline Prefect","Library Prefect","Health Prefect","Cultural Prefect","Chapel Prefect","Class Monitor G7","Class Monitor G8","Class Monitor G9","Deputy Class Monitor G7","Deputy Class Monitor G8","Deputy Class Monitor G9"];
const STUDENT_DUTIES = ["Dining Hall","Compound Cleaning","Classroom Duty","Gate Duty","Library","Chapel/Assembly","Games Area","Kitchen Helper","Garden Duty","Office Errands","Morning Sweeping","Evening Sweeping"];

function getYears() { const y=new Date().getFullYear(); const a=[]; for(let i=2015;i<=y+5;i++) a.push(String(i)); return a; }
const YEARS = getYears();
function cg(cls) { if(["PP1","PP2"].includes(cls)) return "PP"; const n=parseInt(cls.split(" ")[1]); if(n<=3) return "Lower"; if(n<=6) return "Upper"; return "JSS"; }
function getSubs(cls) { return SUBJECTS_MAP[cg(cls)]||[]; }
function getGrade(m) {
  if(m>=90) return {g:"EE1",pts:8,col:"#166534",bg:"#dcfce7",lbl:"Exceeds Expectation 1"};
  if(m>=75) return {g:"EE2",pts:7,col:"#15803d",bg:"#d1fae5",lbl:"Exceeds Expectation 2"};
  if(m>=58) return {g:"ME1",pts:6,col:"#1d4ed8",bg:"#dbeafe",lbl:"Meets Expectation 1"};
  if(m>=41) return {g:"ME2",pts:5,col:"#2563eb",bg:"#eff6ff",lbl:"Meets Expectation 2"};
  if(m>=31) return {g:"AE1",pts:4,col:"#b45309",bg:"#fef3c7",lbl:"Approaching Expectation 1"};
  if(m>=21) return {g:"AE2",pts:3,col:"#d97706",bg:"#fffbeb",lbl:"Approaching Expectation 2"};
  if(m>=11) return {g:"BE1",pts:2,col:"#dc2626",bg:"#fee2e2",lbl:"Below Expectation 1"};
  return {g:"BE2",pts:1,col:"#b91c1c",bg:"#fef2f2",lbl:"Below Expectation 2"};
}
function makeTimeSlots(cfg) {
  const slots=[]; let mins=(parseInt(cfg.startH)||7)*60+(parseInt(cfg.startM)||30);
  const breaks=cfg.breaks||[{afterLesson:cfg.breakAfter||4,name:"Break",mins:cfg.breakMins||20}];
  for(let i=0;i<(cfg.lessons||8);i++){
    const br=breaks.find(b=>parseInt(b.afterLesson)===i);
    if(br) mins+=parseInt(br.mins)||20;
    const dur=cfg.duration||40; const s=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
    mins+=dur; const e=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
    slots.push(`${s}–${e}`);
  }
  return slots;
}
function makeFullSchedule(cfg) {
  // Returns array of {type:"lesson"|"break", label, time} for display
  const items=[]; let mins=(parseInt(cfg.startH)||7)*60+(parseInt(cfg.startM)||30);
  const breaks=cfg.breaks||[{afterLesson:cfg.breakAfter||4,name:"Break",mins:cfg.breakMins||20}];
  let lessonNum=0;
  for(let i=0;i<(cfg.lessons||8);i++){
    const br=breaks.find(b=>parseInt(b.afterLesson)===i);
    if(br){
      const s=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
      const bm=parseInt(br.mins)||20; mins+=bm;
      const e=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
      items.push({type:"break",label:br.name||"Break",time:`${s}–${e}`});
    }
    const dur=cfg.duration||40;
    const s=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
    mins+=dur;
    const e=`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
    lessonNum++;
    items.push({type:"lesson",lessonIdx:i,lessonNum,time:`${s}–${e}`});
  }
  return items;
}

// ══════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ══════════════════════════════════════════════════════════
const SUPA_URL = "https://phorslzvnkbgutujygei.supabase.co";
const SUPA_KEY = "sb_publishable_b1BvpT77pnAXhQCZ--92qA_uBjlakaB";

async function sbGet(table) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*`, {
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`}
    });
    return await r.json();
  } catch { return []; }
}

async function sbUpsert(table, row) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"},
      body: JSON.stringify(row)
    });
  } catch {}
}

async function sbDelete(table, id) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`}
    });
  } catch {}
}

async function sbUpsertMany(table, rows) {
  if (!rows || !rows.length) return;
  try {
    await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"},
      body: JSON.stringify(rows)
    });
  } catch {}
}

async function sbDeleteWhere(table, col, val) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {
      method: "DELETE",
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`}
    });
  } catch {}
}

// Settings helpers (key-value store in settings table)
async function loadSetting(key) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/settings?id=eq.${key}&select=value`, {
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`}
    });
    const d = await r.json();
    return d && d[0] ? d[0].value : null;
  } catch { return null; }
}

async function saveSetting(key, value) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/settings`, {
      method: "POST",
      headers: {"apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"},
      body: JSON.stringify({id: key, value})
    });
  } catch {}
}

const DEFAULT_USERS = [
  {id:"u1",name:"Administrator",username:"admin",password:"admin123",role:"admin",email:"admin@tnks.sc.ke",staffType:"teaching",subject:"Administration",phone:"+254 722 000001"},
  {id:"u2",name:"Gitonga Kelvin",username:"kelvin",password:"kelvin123",role:"teacher",email:"kelvin@tnks.sc.ke",staffType:"teaching",subject:"Mathematics",phone:"+254 722 000002"},
];
const DEFAULT_CFG = {lessons:8,duration:40,startH:7,startM:30,breaks:[{afterLesson:4,name:"Break",mins:20}]};

// ══════════════════════════════════════════════════════════
// BASE UI
// ══════════════════════════════════════════════════════════
const F = "Georgia,serif";
function Card({children,style={}}) { return <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 12px rgba(0,0,0,0.08)",padding:20,...style}}>{children}</div>; }
function Btn({onClick,v="primary",children,full,style={}}) {
  const S={primary:{background:"linear-gradient(135deg,#1d4ed8,#1e3a5f)",color:"white"},green:{background:"linear-gradient(135deg,#15803d,#065f46)",color:"white"},ghost:{background:"#f1f5f9",color:"#374151"},red:{background:"linear-gradient(135deg,#b91c1c,#7f1d1d)",color:"white"},amber:{background:"linear-gradient(135deg,#b45309,#92400e)",color:"white"},teal:{background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white"},purple:{background:"linear-gradient(135deg,#7c3aed,#4c1d95)",color:"white"}};
  return <button onClick={onClick} style={{...S[v],border:"none",borderRadius:9,padding:"8px 18px",fontSize:13,fontWeight:"bold",cursor:"pointer",fontFamily:F,width:full?"100%":"auto",...style}}>{children}</button>;
}
function Inp({label,value,onChange,placeholder,type="text",style={}}) {
  return <div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3,letterSpacing:.5}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:F,...style}} /></div>;
}
function Sel({label,value,onChange,options,style={}}) {
  return <div>{label&&<label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3,letterSpacing:.5}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"white",cursor:"pointer",fontFamily:F,...style}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
}
function Textarea({label,value,onChange,placeholder,rows=3}) {
  return <div>{label&&<label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>{label}</label>}<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F,resize:"vertical",boxSizing:"border-box",outline:"none"}} /></div>;
}
function Stat({icon,label,value,color,sub}) {
  return <Card style={{textAlign:"center",borderLeft:`4px solid ${color}`}}><div style={{fontSize:26,marginBottom:3}}>{icon}</div><div style={{fontSize:21,fontWeight:"bold",color,fontFamily:F}}>{value}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{sub}</div>}</Card>;
}
function PageH({title,sub,children}) {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}><div><h2 style={{margin:0,color:"#1e3a5f",fontSize:22,fontFamily:F}}>{title}</h2>{sub&&<div style={{fontSize:13,color:"#64748b",marginTop:2}}>{sub}</div>}</div>{children&&<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{children}</div>}</div>;
}
function Empty({icon,text}) { return <div style={{textAlign:"center",padding:"30px 20px",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:8}}>{icon}</div><div style={{fontSize:13}}>{text}</div></div>; }
function Avatar({name,photo,size=40}) {
  const init=(name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const cols=["#1d4ed8","#15803d","#b45309","#7c3aed","#0e7490"];
  const col=cols[(name?.charCodeAt(0)||0)%cols.length];
  if(photo) return <img src={photo} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"2px solid #e2e8f0"}} />;
  return <div style={{width:size,height:size,borderRadius:"50%",background:col,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.35,fontWeight:"bold",fontFamily:F}}>{init}</div>;
}
function PhotoUp({value,onChange}) {
  const ref=useRef();
  const hf=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onChange(ev.target.result); r.readAsDataURL(f); };
  return <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:64,height:64,borderRadius:"50%",background:value?"transparent":"#eff6ff",border:"2px dashed #93c5fd",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}} onClick={()=>ref.current?.click()}>{value?<img src={value} alt="photo" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:24}}>📷</span>}</div><div><Btn onClick={()=>ref.current?.click()} v="ghost" style={{fontSize:12}}>Upload Photo</Btn>{value&&<Btn onClick={()=>onChange("")} v="ghost" style={{fontSize:12,marginLeft:6,color:"#b91c1c"}}>Remove</Btn>}</div><input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={hf} /></div>;
}
function Modal({title,onClose,children,wide=false}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:16}}><div style={{background:"white",borderRadius:18,padding:28,width:"95%",maxWidth:wide?820:560,maxHeight:"90vh",overflowY:"auto",fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:16}}>{title}</div><button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18}}>✕</button></div>{children}</div></div>;
}

// ══════════════════════════════════════════════════════════
// LIVE CLOCK
// ══════════════════════════════════════════════════════════
function LiveClock() {
  const [now,setNow]=useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const p=n=>String(n).padStart(2,"0");
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const timeStr=`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
  const dateStr=`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  return (
    <div style={{textAlign:"right",fontFamily:F,lineHeight:1.3}}>
      <div style={{fontSize:20,fontWeight:"bold",color:"#1e3a5f",letterSpacing:2,fontVariantNumeric:"tabular-nums"}}>{timeStr}</div>
      <div style={{fontSize:11,color:"#64748b"}}>{dateStr}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SCHOOL LOGO COMPONENT (dynamic)
// ══════════════════════════════════════════════════════════
const OFFICIAL_LOGO = "data:image/png;base64,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";
function Logo({size=60,src}) {
  const [fallback,setFallback]=useState(false);
  const logoSrc = src || (!fallback ? OFFICIAL_LOGO : null);
  return (
    <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",border:"3px solid #1e3a5f",display:"inline-flex",alignItems:"center",justifyContent:"center",background:"white",flexShrink:0}}>
      {logoSrc ? <img src={logoSrc} alt="TNKS Logo" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setFallback(true)} />
               : <div style={{fontSize:size*.32,color:"#1e3a5f",fontWeight:"bold",textAlign:"center",fontFamily:F}}>TNKS</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════
function Sidebar({view,setView,user,onLogout,logo,open,onToggle}) {
  const adminLinks=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},{id:"students",icon:"👥",label:"Students"},
    {id:"admissions",icon:"📋",label:"Admissions"},{id:"results",icon:"📝",label:"Results Entry"},
    {id:"analytics",icon:"📈",label:"Analytics"},{id:"reports",icon:"🖨️",label:"Report Forms"},
    {id:"fees",icon:"💰",label:"Fees Manager"},{id:"timetable",icon:"📅",label:"Timetable"},
    {id:"attendance",icon:"✅",label:"Attendance"},{id:"timeinout",icon:"🕐",label:"Time In/Out"},
    {id:"staff",icon:"👨‍🏫",label:"Staff Manager"},{id:"duty",icon:"🛡️",label:"Teachers on Duty"},
    {id:"council",icon:"🎖️",label:"Student Council"},{id:"library",icon:"📚",label:"Library"},
    {id:"events",icon:"🎉",label:"Events"},{id:"noticeboard",icon:"📌",label:"Notice Board"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];
  const teacherLinks=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},{id:"students",icon:"👥",label:"Students"},
    {id:"results",icon:"📝",label:"Results Entry"},{id:"analytics",icon:"📈",label:"Analytics"},
    {id:"reports",icon:"🖨️",label:"Report Forms"},{id:"timetable",icon:"📅",label:"Timetable"},
    {id:"attendance",icon:"✅",label:"Attendance"},{id:"timeinout",icon:"🕐",label:"Time In/Out"},
    {id:"duty",icon:"🛡️",label:"Teachers on Duty"},{id:"council",icon:"🎖️",label:"Student Council"},
    {id:"library",icon:"📚",label:"Library"},{id:"noticeboard",icon:"📌",label:"Notice Board"},
  ];
  const parentLinks=[{id:"parent_report",icon:"🖨️",label:"My Child's Report"},{id:"parent_fees",icon:"💰",label:"Fee Statement"},{id:"noticeboard",icon:"📌",label:"Notice Board"}];
  const links=user.role==="admin"?adminLinks:user.role==="parent"?parentLinks:teacherLinks;
  return (
    <div style={{width:open?215:52,background:"#1e3a5f",color:"white",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto",transition:"width .25s",position:"relative"}}>
      <button onClick={onToggle} style={{position:"absolute",top:8,right:open?8:4,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,color:"white",cursor:"pointer",fontSize:16,padding:"4px 7px",zIndex:10}} title={open?"Collapse sidebar":"Expand sidebar"}>{open?"◀":"▶"}</button>
      <div style={{padding:open?"16px 14px 12px":"12px 4px",borderBottom:"1px solid rgba(255,255,255,0.1)",textAlign:"center",overflow:"hidden"}}>
        <Logo size={open?54:36} src={logo} />
        {open&&<><div style={{fontSize:11,fontWeight:"bold",lineHeight:1.3,marginTop:8}}>{SCHOOL.name}</div>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:2,letterSpacing:1}}>{user.role==="admin"?"ADMIN PORTAL":user.role==="teacher"?"STAFF PORTAL":"PARENT PORTAL"}</div></>}
      </div>
      <nav style={{flex:1,padding:"10px 0"}}>
        {links.map(l=>(
          <button key={l.id} onClick={()=>setView(l.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 16px",border:"none",cursor:"pointer",fontFamily:F,fontSize:12,fontWeight:view===l.id?"bold":"normal",background:view===l.id?"rgba(255,255,255,0.15)":"transparent",color:view===l.id?"white":"rgba(255,255,255,0.75)",borderLeft:view===l.id?"3px solid #60a5fa":"3px solid transparent",transition:"all .15s"}}>
            <span style={{fontSize:14}}>{l.icon}</span>{open&&l.label}
          </button>
        ))}
      </nav>
      <div style={{padding:open?"12px 14px":"8px 4px",borderTop:"1px solid rgba(255,255,255,0.1)",textAlign:"center"}}>
        {open&&<><div style={{fontSize:11,fontWeight:"bold",color:"rgba(255,255,255,.9)",marginBottom:1}}>{user.name}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginBottom:8,textTransform:"capitalize"}}>{user.role}</div></>}
        <Btn onClick={onLogout} v="ghost" full style={{fontSize:11,padding:"6px 8px"}}>{open?"🔓 Logout":"🔓"}</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// LOGIN (no share link)
// ══════════════════════════════════════════════════════════
function LoginPage({users,setUsers,students,onLogin,logo}) {
  const [mode,setMode]=useState("staff");
  const [un,setUn]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  const [forgot,setForgot]=useState(false); const [fStep,setFStep]=useState("req");
  const [fUN,setFUN]=useState(""); const [fCode,setFCode]=useState(""); const [nPw,setNPw]=useState("");
  const [fMsg,setFMsg]=useState({t:"",ok:true}); const [genCode,setGenCode]=useState(null);

  function doLogin() {
    if(mode==="staff"){const u=users.find(x=>x.username===un&&x.password===pw); if(u){setErr("");onLogin(u);}else setErr("Invalid username or password.");}
    else{const l=students.find(s=>s.email&&s.email===un&&s.parentPassword&&s.parentPassword===pw); if(l) onLogin({id:"parent_"+l.id,name:"Parent of "+l.name,role:"parent",studentId:l.id}); else setErr("Invalid email or parent password.");}
  }
  function doReq(){const u=users.find(x=>x.username===fUN||x.email===fUN); if(!u){setFMsg({t:"Not found.",ok:false});return;} const c=Math.floor(100000+Math.random()*900000).toString(); setGenCode(c); setFStep("verify"); setFMsg({t:`Reset code: ${c} (in production, sent via SMS/email)`,ok:true});}
  function doVerify(){if(fCode.trim()!==genCode){setFMsg({t:"Wrong code.",ok:false});return;} setFStep("reset"); setFMsg({t:"Code verified!",ok:true});}
  function doReset(){if(nPw.length<6){setFMsg({t:"Min 6 chars.",ok:false});return;} const u=users.find(x=>x.username===fUN||x.email===fUN); const updUser={...users.find(x=>x.id===u.id),password:nPw};setUsers(p=>p.map(x=>x.id===u.id?updUser:x));sbUpsert("users",updUser); setFMsg({t:"Password reset! Login now.",ok:true}); setTimeout(()=>{setForgot(false);setFStep("req");setFUN("");setFCode("");setNPw("");setGenCode(null);setFMsg({t:"",ok:true});},2000);}

  if(forgot) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a5f,#15803d)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:F}}>
      <div style={{background:"white",borderRadius:20,boxShadow:"0 24px 64px rgba(0,0,0,.25)",padding:36,width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:20}}><Logo size={64} src={logo} /><div style={{fontSize:17,fontWeight:"bold",color:"#1e3a5f",marginTop:8}}>🔑 Password Reset</div></div>
        {fStep==="req"&&<div style={{display:"grid",gap:12}}><Inp label="USERNAME / EMAIL" value={fUN} onChange={setFUN} placeholder="Your username or email" />{fMsg.t&&<div style={{fontSize:13,color:fMsg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{fMsg.t}</div>}<Btn onClick={doReq} v="primary" full>Generate Code</Btn><Btn onClick={()=>setForgot(false)} v="ghost" full>← Back</Btn></div>}
        {fStep==="verify"&&<div style={{display:"grid",gap:12}}>{fMsg.t&&<div style={{fontSize:13,color:fMsg.ok?"#15803d":"#b91c1c",fontWeight:"bold",background:"#f0fdf4",padding:"10px 14px",borderRadius:8}}>{fMsg.t}</div>}<Inp label="ENTER CODE" value={fCode} onChange={setFCode} placeholder="6-digit code" /><Btn onClick={doVerify} v="primary" full>Verify</Btn></div>}
        {fStep==="reset"&&<div style={{display:"grid",gap:12}}><Inp label="NEW PASSWORD" value={nPw} onChange={setNPw} placeholder="Min 6 characters" type="password" />{fMsg.t&&<div style={{fontSize:13,color:fMsg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{fMsg.t}</div>}<Btn onClick={doReset} v="green" full>Set Password</Btn></div>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a5f 0%,#15803d 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:F}}>
      <div style={{background:"white",borderRadius:20,boxShadow:"0 24px 64px rgba(0,0,0,.25)",padding:36,width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <Logo size={80} src={logo} />
          <div style={{fontSize:20,fontWeight:"bold",color:"#1e3a5f",marginTop:12}}>{SCHOOL.name}</div>
          <div style={{fontSize:11,color:"#15803d",fontStyle:"italic",marginTop:4}}>"{SCHOOL.motto}"</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:20,background:"#f1f5f9",borderRadius:10,padding:4}}>
          {[["staff","👨‍🏫 Staff / Admin"],["parent","👨‍👩‍👧 Parent"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px 8px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:F,fontSize:13,fontWeight:mode===m?"bold":"normal",background:mode===m?"white":"transparent",color:mode===m?"#1e3a5f":"#64748b",boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.1)":"none",transition:"all .2s"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"grid",gap:12}}>
          <Inp label={mode==="staff"?"USERNAME":"LEARNER EMAIL"} value={un} onChange={setUn} placeholder={mode==="staff"?"e.g. kelvin":"student@gmail.com"} />
          <Inp label={mode==="staff"?"PASSWORD":"PARENT PASSWORD"} value={pw} onChange={setPw} placeholder="Enter password" type="password" />
          {err&&<div style={{fontSize:13,color:"#b91c1c",fontWeight:"bold"}}>{err}</div>}
          <Btn onClick={doLogin} v="primary" full>🔐 Login</Btn>
          <button onClick={()=>setForgot(true)} style={{background:"none",border:"none",color:"#1d4ed8",cursor:"pointer",fontSize:12,fontFamily:F}}>Forgot password?</button>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
function Dashboard({students,results,announcements,fees,staff,users,term,setTerm,year,setYear,examType,setExamType,logo}) {
  const pr=results.filter(r=>r.term===term&&r.year===year&&r.examType===examType);
  const classDist=ALL_CLASSES.map(c=>({name:c.replace("Grade ","G"),count:students.filter(s=>s.class===c).length})).filter(x=>x.count>0);
  const classAvgs=ALL_CLASSES.map(c=>{const cr=pr.filter(r=>r.class===c); const avg=cr.length?cr.reduce((a,b)=>a+b.marks,0)/cr.length:0; return {name:c.replace("Grade ","G"),avg:parseFloat(avg.toFixed(1))};}).filter(x=>x.avg>0);
  const totalDue=(fees||[]).reduce((a,b)=>a+(b.amount||0),0);
  const totalPaid=(fees||[]).reduce((a,b)=>a+(b.paid||0),0);
  const teaching=(staff||[]).filter(s=>s.staffType==="teaching").length||(users||[]).filter(u=>u.role==="teacher").length;
  const recentAnn=(announcements||[]).slice(-3).reverse();
  const gradeMap={EE1:0,EE2:0,ME1:0,ME2:0,AE1:0,AE2:0,BE1:0,BE2:0};
  pr.forEach(r=>{const g=getGrade(r.marks); gradeMap[g.g]++;});
  const gradePie=Object.entries(gradeMap).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  const bandCols={EE1:"#166534",EE2:"#15803d",ME1:"#1d4ed8",ME2:"#2563eb",AE1:"#b45309",AE2:"#d97706",BE1:"#dc2626",BE2:"#b91c1c"};
  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Logo size={52} src={logo} />
          <div><h2 style={{margin:0,color:"#1e3a5f",fontSize:20,fontFamily:F}}>{SCHOOL.name}</h2><div style={{fontSize:12,color:"#64748b"}}>Academic Management Dashboard — CBC System</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <LiveClock />
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Sel value={term} onChange={setTerm} options={TERMS} /><Sel value={examType} onChange={setExamType} options={EXAM_TYPES} /><Sel value={year} onChange={setYear} options={YEARS} /></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
        <Stat icon="👥" label="Total Learners" value={students.length} color="#1d4ed8" />
        <Stat icon="🏫" label="Classes Active" value={[...new Set(students.map(s=>s.class))].length} color="#15803d" />
        <Stat icon="📝" label="Results Entered" value={pr.length} color="#b45309" />
        <Stat icon="💰" label="Fee Balance" value={`KES ${(totalDue-totalPaid).toLocaleString()}`} color="#b91c1c" sub="outstanding" />
        <Stat icon="👨‍🏫" label="Teaching Staff" value={teaching} color="#7c3aed" />
        <Stat icon="📊" label="Pass Rate" value={pr.length?((pr.filter(r=>r.marks>=41).length/pr.length)*100).toFixed(0)+"%":"—"} color="#0e7490" />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
        <Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Learners per Class</div>{classDist.length?<ResponsiveContainer width="100%" height={180}><BarChart data={classDist}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="count" fill="#1d4ed8" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<Empty icon="👥" text="No learners yet"/>}</Card>
        <Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Class Averages — {examType}</div>{classAvgs.length?<ResponsiveContainer width="100%" height={180}><BarChart data={classAvgs}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/><Tooltip formatter={v=>[`${v}%`]}/><Bar dataKey="avg" fill="#15803d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<Empty icon="📊" text="No results yet"/>}</Card>
        <Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>CBC Grade Distribution</div>{gradePie.length?<ResponsiveContainer width="100%" height={180}><PieChart><Pie data={gradePie} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,value})=>`${name}:${value}`} style={{fontSize:10}}>{gradePie.map((e,i)=><Cell key={i} fill={bandCols[e.name]||CC[i%CC.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>:<Empty icon="🎯" text="Enter results first"/>}</Card>
      </div>
      {recentAnn.length>0&&<Card style={{background:"#fffbeb",border:"1px solid #fde68a"}}><div style={{fontWeight:"bold",color:"#92400e",marginBottom:10,fontSize:13}}>📌 Recent Notices</div>{recentAnn.map((a,i)=><div key={i} style={{display:"flex",gap:12,marginBottom:8,padding:"8px 12px",background:"white",borderRadius:8,borderLeft:"3px solid #f59e0b"}}><div style={{fontSize:12,flex:1}}><b>{a.title}</b> — {(a.body||"").slice(0,70)}{(a.body||"").length>70?"…":""}</div><div style={{fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{a.date}</div></div>)}</Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STUDENTS
// ══════════════════════════════════════════════════════════
function StudentsPage({students,setStudents}) {
  const blank={name:"",admNo:"",class:"Grade 7",gender:"Male",photo:"",email:"",parentPassword:"",dob:"",parentName:"",parentPhone:"",address:""};
  const [form,setForm]=useState(blank); const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState(""); const [filterCls,setFilterCls]=useState("All");
  const [msg,setMsg]=useState({t:"",ok:true}); const [tab,setTab]=useState("list");
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2800);};
  async function doSave(){if(!form.name.trim()||!form.admNo.trim()) return flash("Name and admission number required.",false); if(editId){const updated={...students.find(s=>s.id===editId),...form};setStudents(p=>p.map(s=>s.id===editId?updated:s));await sbUpsert("students",updated);setEditId(null);flash("Learner updated!");}else{if(students.find(s=>s.admNo===form.admNo)) return flash("Admission number already exists.",false); const ns={...form,id:Date.now().toString(),status:"active",enrollDate:new Date().toLocaleDateString("en-KE")};setStudents(p=>[...p,ns]);await sbUpsert("students",ns);flash("Learner added!");} setForm(blank);setTab("list");}
  function doEdit(s){setForm({name:s.name,admNo:s.admNo,class:s.class,gender:s.gender||"Male",photo:s.photo||"",email:s.email||"",parentPassword:s.parentPassword||"",dob:s.dob||"",parentName:s.parentName||"",parentPhone:s.parentPhone||"",address:s.address||""});setEditId(s.id);setTab("add");}
  async function doDel(id){if(confirm("Delete this learner?")){setStudents(p=>p.filter(s=>s.id!==id));await sbDelete("students",id);}}
  const filtered=students.filter(s=>{const q=search.toLowerCase(); return (s.name.toLowerCase().includes(q)||s.admNo.toLowerCase().includes(q))&&(filterCls==="All"||s.class===filterCls);});
  const th={textAlign:"left",padding:"10px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff",letterSpacing:.5};
  const td={padding:"9px 12px",fontSize:12,color:"#374151",borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Students" sub="Manage all learners"><div style={{display:"flex",gap:6}}>{["list","add"].map(t=><Btn key={t} onClick={()=>{setTab(t);if(t==="add"&&!editId)setForm(blank);}} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{t==="list"?"📋 List":"➕ Add"}</Btn>)}</div></PageH>
      {tab==="add"&&<Card style={{marginBottom:20}}><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:14,fontSize:14}}>{editId?"Edit Learner":"Add New Learner"}</div><div style={{marginBottom:14}}><PhotoUp value={form.photo} onChange={v=>setForm({...form,photo:v})}/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Inp label="FULL NAME *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Full name"/><Inp label="ADM. NUMBER *" value={form.admNo} onChange={v=>setForm({...form,admNo:v})} placeholder="NKS/2025/001"/><Sel label="CLASS" value={form.class} onChange={v=>setForm({...form,class:v})} options={ALL_CLASSES}/><Sel label="GENDER" value={form.gender} onChange={v=>setForm({...form,gender:v})} options={["Male","Female"]}/><Inp label="DATE OF BIRTH" value={form.dob} onChange={v=>setForm({...form,dob:v})} placeholder="DD/MM/YYYY"/><Inp label="PARENT/GUARDIAN" value={form.parentName} onChange={v=>setForm({...form,parentName:v})} placeholder="Parent full name"/><Inp label="PARENT PHONE" value={form.parentPhone} onChange={v=>setForm({...form,parentPhone:v})} placeholder="+254 7..."/><Inp label="HOME ADDRESS" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Village/Location"/></div><div style={{marginTop:12,paddingTop:12,borderTop:"1px dashed #e2e8f0"}}><div style={{fontSize:12,fontWeight:"bold",color:"#1e3a5f",marginBottom:10}}>👨‍👩‍👧 Parent Portal Access</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="LEARNER EMAIL (parent login)" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="john@gmail.com" type="email"/><Inp label="PARENT PASSWORD" value={form.parentPassword} onChange={v=>setForm({...form,parentPassword:v})} placeholder="Set password" type="password"/></div></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={doSave} v="primary">{editId?"Update":"Add Learner"}</Btn>{editId&&<Btn onClick={()=>{setEditId(null);setForm(blank);setTab("list");}} v="ghost">Cancel</Btn>}</div></Card>}
      {tab==="list"&&<><div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or adm. no..." style={{flex:1,minWidth:200,border:"1.5px solid #e2e8f0",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:F,outline:"none"}}/><Sel value={filterCls} onChange={setFilterCls} options={["All",...ALL_CLASSES]}/><span style={{fontSize:12,color:"#64748b"}}>{filtered.length} learner(s)</span></div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["","#","Adm.No","Name","Class","Gender","Parent","Portal","Actions"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{filtered.length?filtered.map((s,i)=><tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,width:46}}><Avatar name={s.name} photo={s.photo} size={34}/></td><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{s.admNo}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.class}</span></td><td style={td}>{s.gender||"—"}</td><td style={{...td,fontSize:11}}>{s.parentName||"—"}</td><td style={td}>{s.email?<span style={{fontSize:10,color:"#15803d"}}>✅</span>:<span style={{fontSize:10,color:"#94a3b8"}}>—</span>}</td><td style={td}><button onClick={()=>doEdit(s)} style={{color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",fontSize:12,marginRight:8}}>Edit</button><button onClick={()=>doDel(s.id)} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:12}}>Del</button></td></tr>):<tr><td colSpan={9} style={{padding:40,textAlign:"center",color:"#94a3b8"}}>No learners found.</td></tr>}</tbody></table></Card></>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMISSIONS
// ══════════════════════════════════════════════════════════
function AdmissionsPage({students,setStudents}) {
  const blank={name:"",admNo:"",class:"Grade 1",gender:"Male",dob:"",parentName:"",parentPhone:"",prevSchool:"",date:new Date().toLocaleDateString("en-KE"),type:"new"};
  const [form,setForm]=useState(blank); const [msg,setMsg]=useState({t:"",ok:true}); const [tab,setTab]=useState("admit");
  const [tStu,setTStu]=useState(""); const [tDest,setTDest]=useState(""); const [tReason,setTReason]=useState(""); const [tMsg,setTMsg]=useState("");
  const [search,setSearch]=useState("");
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),3000);};
  function doAdmit(){if(!form.name||!form.admNo) return flash("Name and Adm. No required.",false); if(students.find(s=>s.admNo===form.admNo)) return flash("Adm. No exists.",false); setStudents(p=>[...p,{...form,id:Date.now().toString(),status:"active",enrollDate:form.date}]); flash("✅ Learner admitted!"); setForm(blank);}
  function doTransfer(){const s=students.find(x=>x.id===tStu); if(!s){setTMsg("Select student.");return;} setStudents(p=>p.map(x=>x.id===tStu?{...x,status:"transferred",transferDest:tDest,transferReason:tReason,transferDate:new Date().toLocaleDateString("en-KE")}:x)); setTMsg("✅ Transfer recorded."); setTStu("");setTDest("");setTReason("");}
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Admissions & Transfers" sub="New admissions, re-admissions and transfers"/>
      <div style={{display:"flex",gap:8,marginBottom:18}}>{[["admit","📋 Admit"],["transfer","🔄 Transfer Out"],["register","📜 Register"],["transferred","📤 Transferred"]].map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}</div>
      {tab==="admit"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>New Admission / Re-Admission</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Inp label="FULL NAME *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Learner name"/><Inp label="ADM. NUMBER *" value={form.admNo} onChange={v=>setForm({...form,admNo:v})} placeholder="NKS/2025/001"/><Sel label="CLASS" value={form.class} onChange={v=>setForm({...form,class:v})} options={ALL_CLASSES}/><Sel label="GENDER" value={form.gender} onChange={v=>setForm({...form,gender:v})} options={["Male","Female"]}/><Inp label="DATE OF BIRTH" value={form.dob} onChange={v=>setForm({...form,dob:v})} placeholder="DD/MM/YYYY"/><Inp label="ADMISSION DATE" value={form.date} onChange={v=>setForm({...form,date:v})} placeholder="DD/MM/YYYY"/><Inp label="PARENT/GUARDIAN" value={form.parentName} onChange={v=>setForm({...form,parentName:v})} placeholder="Parent name"/><Inp label="PARENT PHONE" value={form.parentPhone} onChange={v=>setForm({...form,parentPhone:v})} placeholder="+254 7..."/><Inp label="PREVIOUS SCHOOL" value={form.prevSchool} onChange={v=>setForm({...form,prevSchool:v})} placeholder="Prev school"/><Sel label="ADMISSION TYPE" value={form.type} onChange={v=>setForm({...form,type:v})} options={["new","re-admission","transfer-in"]}/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doAdmit} v="green">✅ Admit Learner</Btn></div></Card>}
      {tab==="transfer"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>Transfer Out / Withdrawal</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:4}}>SELECT STUDENT</label><select value={tStu} onChange={e=>setTStu(e.target.value)} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select student --</option>{students.filter(s=>s.status!=="transferred").map(s=><option key={s.id} value={s.id}>{s.name} ({s.admNo}) — {s.class}</option>)}</select></div><Inp label="DESTINATION SCHOOL" value={tDest} onChange={setTDest} placeholder="School transferring to"/><Textarea label="REASON" value={tReason} onChange={setTReason} placeholder="Reason for transfer..."/></div>{tMsg&&<div style={{marginTop:10,fontSize:13,color:"#15803d",fontWeight:"bold"}}>{tMsg}</div>}<div style={{marginTop:14}}><Btn onClick={doTransfer} v="amber">🔄 Record Transfer</Btn></div></Card>}
      {tab==="register"&&<><div style={{marginBottom:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F,outline:"none",width:280}}/></div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Adm.No","Name","Class","Gender","Date Admitted","Type","Status"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{students.filter(s=>s.enrollDate&&(!search||s.name.toLowerCase().includes(search.toLowerCase())||s.admNo.toLowerCase().includes(search.toLowerCase()))).map((s,i)=><tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{s.admNo}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}>{s.class}</td><td style={td}>{s.gender||"—"}</td><td style={td}>{s.enrollDate||"—"}</td><td style={td}><span style={{fontSize:10,background:"#eff6ff",color:"#1d4ed8",padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.type||"new"}</span></td><td style={td}><span style={{fontSize:10,background:s.status==="active"?"#f0fdf4":"#fef2f2",color:s.status==="active"?"#15803d":"#b91c1c",padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.status||"active"}</span></td></tr>)}</tbody></table></Card></>}
      {tab==="transferred"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Name","Class","Transfer To","Reason","Date"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{students.filter(s=>s.status==="transferred").length?students.filter(s=>s.status==="transferred").map((s,i)=><tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}>{s.class}</td><td style={td}>{s.transferDest||"—"}</td><td style={td}>{s.transferReason||"—"}</td><td style={td}>{s.transferDate||"—"}</td></tr>):<tr><td colSpan={5} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No transfers recorded.</td></tr>}</tbody></table></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// RESULTS ENTRY
// ══════════════════════════════════════════════════════════
function ResultsPage({students,results,setResults,comments,setComments,users,term,setTerm,year,setYear,examType,setExamType,user}) {
  const [cls,setCls]=useState("Grade 7"); const [sub,setSub]=useState(""); const [marks,setMarks]=useState({});
  const [msg,setMsg]=useState(""); const [tab,setTab]=useState("entry");
  const [cmMode,setCmMode]=useState(false); const [cmStu,setCmStu]=useState(null); const [cmText,setCmText]=useState(""); const [cmMsg,setCmMsg]=useState("");
  const subs=getSubs(cls); const curSub=sub||subs[0]||"";
  const clsStu=students.filter(s=>s.class===cls).sort((a,b)=>a.name.localeCompare(b.name));
  useEffect(()=>{const m={}; clsStu.forEach(s=>{const r=results.find(r=>r.studentId===s.id&&r.class===cls&&r.subject===curSub&&r.term===term&&r.year===year&&r.examType===examType); if(r) m[s.id]=r.marks;}); setMarks(m);},[cls,curSub,term,year,examType,results.length]);
  function doSave(){const next=[...results.filter(r=>!(r.class===cls&&r.subject===curSub&&r.term===term&&r.year===year&&r.examType===examType))]; clsStu.forEach(s=>{const m=marks[s.id]; if(m!==""&&m!==undefined&&m!==null&&!isNaN(parseFloat(m))) next.push({id:`${s.id}-${cls}-${curSub}-${term}-${year}-${examType}`,studentId:s.id,class:cls,subject:curSub,term,year,examType,marks:parseFloat(m)});}); setResults(next); setMsg("✅ Results saved!"); setTimeout(()=>setMsg(""),2500);}
  async function saveCm(){if(!cmText.trim()){setCmMsg("Enter a comment.");return;} const nc={id:`${cmStu.id}-${term}-${year}-${examType}`,studentId:cmStu.id,term,year,examType,text:cmText.trim(),teacher:user?.name||"Teacher",date:new Date().toLocaleDateString("en-KE")}; setComments(p=>[...(p||[]).filter(c=>c.id!==nc.id),nc]); await sbUpsert("comments",nc); setCmMsg("✅ Saved!"); setTimeout(()=>{setCmMsg("");setCmMode(false);},1500);}
  const th={textAlign:"left",padding:"10px 14px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff",letterSpacing:.5};
  const td={padding:"8px 12px",fontSize:13,color:"#374151",borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Results Entry" sub="Enter marks per subject, class and exam type (CBC)"/>
      {cmMode&&cmStu&&<Modal title={`💬 Comment — ${cmStu.name}`} onClose={()=>setCmMode(false)}><div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{term} — {examType} — {year}</div><Textarea value={cmText} onChange={setCmText} placeholder="Write comment..." rows={4}/>{cmMsg&&<div style={{marginTop:8,fontSize:13,color:"#15803d",fontWeight:"bold"}}>{cmMsg}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={saveCm} v="primary">Save</Btn><Btn onClick={()=>setCmMode(false)} v="ghost">Cancel</Btn></div></Modal>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[["entry","📝 Entry"],["classview","📊 Class View"]].map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}</div>
      <Card style={{marginBottom:18}}><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Sel label="CLASS" value={cls} onChange={v=>{setCls(v);setSub("");}} options={ALL_CLASSES}/><Sel label="SUBJECT" value={curSub} onChange={setSub} options={subs}/><Sel label="TERM" value={term} onChange={setTerm} options={TERMS}/><Sel label="EXAM TYPE" value={examType} onChange={setExamType} options={EXAM_TYPES}/><Sel label="YEAR" value={year} onChange={setYear} options={YEARS}/></div></Card>
      {tab==="entry"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Name","Marks (0-100)","Grade","Points","Comment"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{clsStu.length?clsStu.map((s,i)=>{const m=marks[s.id]; const g=m!==""&&m!==undefined&&!isNaN(parseFloat(m))?getGrade(parseFloat(m)):null; return(<tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}><input type="number" min={0} max={100} value={m||""} onChange={e=>{const n=parseFloat(e.target.value); setMarks(p=>({...p,[s.id]:isNaN(n)?""  :Math.min(100,Math.max(0,n))}));}} style={{width:80,border:"1.5px solid #e2e8f0",borderRadius:6,padding:"6px 8px",fontSize:13,fontFamily:F,textAlign:"center",outline:"none"}} placeholder="—"/></td><td style={td}>{g?<span style={{background:g.bg,color:g.col,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{g.g}</span>:"—"}</td><td style={{...td,textAlign:"center"}}>{g?g.pts:"—"}</td><td style={td}><button onClick={()=>{setCmStu(s);const ex=(comments||[]).find(c=>c.studentId===s.id&&c.term===term&&c.year===year&&c.examType===examType);setCmText(ex?ex.text:"");setCmMode(true);}} style={{background:"#eff6ff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#1d4ed8",fontFamily:F}}>💬</button></td></tr>);}):<tr><td colSpan={6} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No learners in {cls}.</td></tr>}</tbody></table>{clsStu.length>0&&<div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:12}}><Btn onClick={doSave} v="green">💾 Save Results</Btn>{msg&&<span style={{color:"#15803d",fontWeight:"bold",fontSize:13}}>{msg}</span>}</div>}</Card>}
      {tab==="classview"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Name",...subs.map(s=>s.split(" ")[0].slice(0,7)),"Avg","Grade"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{clsStu.length?clsStu.map((s,i)=>{const sr=results.filter(r=>r.studentId===s.id&&r.class===cls&&r.term===term&&r.year===year&&r.examType===examType); const avg=sr.length?sr.reduce((a,b)=>a+b.marks,0)/sr.length:0; const g=avg>0?getGrade(avg):null; return(<tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td>{subs.map(su=>{const r=sr.find(x=>x.subject===su); const mg=r?getGrade(r.marks):null; return <td key={su} style={td}>{r?<span style={{background:mg.bg,color:mg.col,fontSize:10,padding:"1px 5px",borderRadius:12,fontWeight:"bold"}}>{r.marks}</span>:"—"}</td>;})}  <td style={{...td,fontWeight:"bold"}}>{avg>0?avg.toFixed(1):"—"}</td><td style={td}>{g?<span style={{background:g.bg,color:g.col,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{g.g}</span>:"—"}</td></tr>);}):<tr><td colSpan={subs.length+4} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No learners.</td></tr>}</tbody></table></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ZERAKI-STYLE ANALYTICS
// ══════════════════════════════════════════════════════════
function AnalyticsPage({students,results,term,setTerm,year,setYear,examType,setExamType}) {
  const [cls,setCls]=useState("All"); const [tab,setTab]=useState("overview");
  const pr=results.filter(r=>r.term===term&&r.year===year&&r.examType===examType);
  const fr=cls==="All"?pr:pr.filter(r=>r.class===cls);
  const classPerf=ALL_CLASSES.map(c=>{const cr=pr.filter(r=>r.class===c); if(!cr.length) return null; const avg=cr.reduce((a,b)=>a+b.marks,0)/cr.length; const clsStu=students.filter(s=>s.class===c); const avgs=clsStu.map(s=>{const sr=cr.filter(r=>r.studentId===s.id); return sr.length?sr.reduce((a,b)=>a+b.marks,0)/sr.length:null;}).filter(v=>v!==null); const pass=avgs.filter(a=>a>=41).length; return {class:c,avg:parseFloat(avg.toFixed(1)),count:clsStu.length,pass,passRate:avgs.length?parseFloat((pass/avgs.length*100).toFixed(1)):0};}).filter(Boolean);
  const subPerf=(cls==="All"?[...new Set(pr.map(r=>r.subject))]:getSubs(cls)).map(sub=>{const sr=fr.filter(r=>r.subject===sub); if(!sr.length) return null; const avg=sr.reduce((a,b)=>a+b.marks,0)/sr.length; const pass=sr.filter(r=>r.marks>=41).length; return {subject:sub.split(" ").slice(0,2).join(" "),full:sub,avg:parseFloat(avg.toFixed(1)),count:sr.length,pass,passRate:parseFloat((pass/sr.length*100).toFixed(1))};}).filter(Boolean).sort((a,b)=>b.avg-a.avg);
  const clsList=cls==="All"?ALL_CLASSES:[cls];
  const rankings=clsList.flatMap(c=>{return students.filter(s=>s.class===c).map(s=>{const sr=pr.filter(r=>r.studentId===s.id&&r.class===c); if(!sr.length) return null; const total=sr.reduce((a,b)=>a+b.marks,0); const avg=total/sr.length; const g=getGrade(avg); return {...s,total,avg:parseFloat(avg.toFixed(1)),grade:g.g,pts:g.pts,bg:g.bg,col:g.col,subs:sr.length};}).filter(Boolean).sort((a,b)=>b.avg-a.avg).map((s,i)=>({...s,rank:i+1}));}).sort((a,b)=>b.avg-a.avg);
  const gMap={EE1:0,EE2:0,ME1:0,ME2:0,AE1:0,AE2:0,BE1:0,BE2:0}; fr.forEach(r=>{const g=getGrade(r.marks); gMap[g.g]++;});
  const gpie=Object.entries(gMap).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  const bcols={EE1:"#166534",EE2:"#15803d",ME1:"#1d4ed8",ME2:"#2563eb",AE1:"#b45309",AE2:"#d97706",BE1:"#dc2626",BE2:"#b91c1c"};
  const atRisk=rankings.filter(s=>s.avg<41);
  const boys=students.filter(s=>s.gender==="Male"); const girls=students.filter(s=>s.gender==="Female");
  const bAvg=boys.length?(()=>{const r=pr.filter(x=>boys.find(b=>b.id===x.studentId)); return r.length?r.reduce((a,b)=>a+b.marks,0)/r.length:0;})():0;
  const gAvg=girls.length?(()=>{const r=pr.filter(x=>girls.find(g=>g.id===x.studentId)); return r.length?r.reduce((a,b)=>a+b.marks,0)/r.length:0;})():0;
  const trend=EXAM_TYPES.map(et=>({name:et.replace(" Exam",""),avg:(()=>{const r=results.filter(x=>x.term===term&&x.year===year&&x.examType===et&&(cls==="All"||x.class===cls)); return r.length?parseFloat((r.reduce((a,b)=>a+b.marks,0)/r.length).toFixed(1)):0;})()}));
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  const tabs=[["overview","📊 Overview"],["rankings","🏆 Rankings"],["subjects","📚 Subjects"],["bands","🎯 Grade Bands"],["trends","📈 Trends"],["atrisk","⚠️ At-Risk"],["gender","👫 Gender"]];
  return (
    <div style={{padding:24}}>
      <PageH title="📈 Analytics — Zeraki Style" sub="Comprehensive CBC performance intelligence">
        <Sel value={cls} onChange={setCls} options={["All",...ALL_CLASSES]}/><Sel value={term} onChange={setTerm} options={TERMS}/><Sel value={examType} onChange={setExamType} options={EXAM_TYPES}/><Sel value={year} onChange={setYear} options={YEARS}/>
      </PageH>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>{tabs.map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:11}}>{l}</Btn>)}</div>

      {tab==="overview"&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
          <Stat icon="📊" label="Total Records" value={fr.length} color="#1d4ed8"/>
          <Stat icon="📈" label="Mean Score" value={fr.length?(fr.reduce((a,b)=>a+b.marks,0)/fr.length).toFixed(1)+"%":"—"} color="#15803d"/>
          <Stat icon="✅" label="Pass Rate" value={fr.length?((fr.filter(r=>r.marks>=41).length/fr.length)*100).toFixed(1)+"%":"—"} color="#7c3aed"/>
          <Stat icon="⭐" label="EE Rate" value={fr.length?((fr.filter(r=>r.marks>=75).length/fr.length)*100).toFixed(1)+"%":"—"} color="#b45309"/>
          <Stat icon="⚠️" label="At-Risk" value={atRisk.length} color="#b91c1c" sub="below ME2"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Class Performance</div>{classPerf.length?<ResponsiveContainer width="100%" height={220}><BarChart data={classPerf} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/><YAxis dataKey="class" type="category" tick={{fontSize:10}} width={65}/><Tooltip formatter={v=>[`${v}%`]}/><Bar dataKey="avg" fill="#1d4ed8" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<Empty icon="📊" text="No results yet"/>}</Card>
          <Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Pass Rate by Class</div>{classPerf.length?<ResponsiveContainer width="100%" height={220}><BarChart data={classPerf}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="class" tick={{fontSize:9}}/><YAxis domain={[0,100]} tick={{fontSize:10}}/><Tooltip formatter={v=>[`${v}%`]}/><Bar dataKey="passRate" fill="#15803d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<Empty icon="📊" text="No results yet"/>}</Card>
        </div>
      </>}

      {tab==="rankings"&&<Card style={{padding:0,overflow:"hidden"}}><div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>Top {Math.min(50,rankings.length)} Students — {cls==="All"?"All Classes":cls}</div><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Rank","Name","Class","Avg","Grade","Pts","Subjects","Status"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{rankings.slice(0,50).map((s,i)=><tr key={s.id} style={{background:i===0?"#fffbeb":i===1?"#f0fdf4":i===2?"#eff6ff":i%2===0?"white":"#fafafa"}}><td style={{...td,fontWeight:"bold",color:i<3?"#b45309":"#94a3b8"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":s.rank}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.class}</span></td><td style={{...td,fontWeight:"bold",fontSize:14}}>{s.avg}%</td><td style={td}><span style={{background:s.bg,color:s.col,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.grade}</span></td><td style={{...td,textAlign:"center"}}>{s.pts}</td><td style={td}>{s.subs}</td><td style={td}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:s.avg>=75?"#dcfce7":s.avg>=41?"#dbeafe":"#fee2e2",color:s.avg>=75?"#15803d":s.avg>=41?"#1d4ed8":"#b91c1c"}}>{s.avg>=75?"Excellent":s.avg>=41?"Passing":"Below"}</span></td></tr>)}{!rankings.length&&<tr><td colSpan={8} style={{padding:40,textAlign:"center",color:"#94a3b8"}}>No results for this selection.</td></tr>}</tbody></table></Card>}

      {tab==="subjects"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Average by Subject</div>{subPerf.length?<ResponsiveContainer width="100%" height={240}><BarChart data={subPerf} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/><YAxis dataKey="subject" type="category" tick={{fontSize:10}} width={90}/><Tooltip formatter={(v,n,p)=>[`${v}%`,p.payload.full]}/><Bar dataKey="avg" radius={[0,5,5,0]}>{subPerf.map((e,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Bar></BarChart></ResponsiveContainer>:<Empty icon="📚" text="No data"/>}</Card><Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Pass Rate by Subject</div>{subPerf.length?<ResponsiveContainer width="100%" height={240}><BarChart data={subPerf} layout="vertical"><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tick={{fontSize:10}}/><YAxis dataKey="subject" type="category" tick={{fontSize:10}} width={90}/><Tooltip formatter={v=>[`${v}%`]}/><Bar dataKey="passRate" fill="#15803d" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<Empty icon="📚" text="No data"/>}</Card></div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Subject","Avg","Pass Rate","Records","Performance Bar"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{subPerf.map((s,i)=><tr key={i} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,fontWeight:"bold"}}>{s.full}</td><td style={{...td,fontWeight:"bold",color:s.avg>=75?"#15803d":s.avg>=41?"#1d4ed8":"#b91c1c"}}>{s.avg}%</td><td style={td}>{s.passRate}%</td><td style={{...td,color:"#94a3b8"}}>{s.count}</td><td style={td}><div style={{width:"100%",height:8,background:"#f1f5f9",borderRadius:4}}><div style={{width:`${s.avg}%`,height:"100%",borderRadius:4,background:s.avg>=75?"#15803d":s.avg>=58?"#1d4ed8":s.avg>=41?"#7c3aed":"#dc2626"}}/></div></td></tr>)}{!subPerf.length&&<tr><td colSpan={5} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No data.</td></tr>}</tbody></table></Card></>}

      {tab==="bands"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:12,fontSize:13}}>Grade Band Distribution</div>{gpie.length?<ResponsiveContainer width="100%" height={280}><PieChart><Pie data={gpie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value,percent})=>`${name}:${value} (${(percent*100).toFixed(0)}%)`} style={{fontSize:11}}>{gpie.map((e,i)=><Cell key={i} fill={bcols[e.name]||CC[i%8]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>:<Empty icon="🎯" text="No results"/>}</Card><Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:16,fontSize:13}}>Band Breakdown</div>{Object.entries(gMap).map(([band,count])=>{const g=getGrade(band==="EE1"?95:band==="EE2"?80:band==="ME1"?65:band==="ME2"?50:band==="AE1"?35:band==="AE2"?25:band==="BE1"?15:5); const pct=fr.length?Math.round(count/fr.length*100):0; return(<div key={band} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{background:g.bg,color:g.col,fontSize:11,padding:"2px 10px",borderRadius:20,fontWeight:"bold"}}>{band}</span><span style={{fontSize:12,color:"#374151"}}>{count} students ({pct}%)</span></div><div style={{width:"100%",height:10,background:"#f1f5f9",borderRadius:5}}><div style={{width:`${pct}%`,height:"100%",borderRadius:5,background:g.col}}/></div><div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{g.lbl}</div></div>);})}</Card></div>}

      {tab==="trends"&&<Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:16,fontSize:13}}>Performance Trend — {term} {year} {cls!=="All"?`(${cls})`:""}</div>{trend.some(d=>d.avg>0)?<ResponsiveContainer width="100%" height={300}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip formatter={v=>[`${v}%`]}/><Legend/><Line type="monotone" dataKey="avg" stroke="#1d4ed8" strokeWidth={3} dot={{r:6}} activeDot={{r:8}} name="Average Score"/></LineChart></ResponsiveContainer>:<Empty icon="📈" text="Enter results for multiple exam types to see trends"/>}</Card>}

      {tab==="atrisk"&&<><div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#b91c1c"}}>⚠️ <b>{atRisk.length} learner(s)</b> are scoring below ME2 (41%). These students require immediate intervention and support.</div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Rank","Name","Class","Average","Grade","Action Needed"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{atRisk.sort((a,b)=>a.avg-b.avg).map((s,i)=><tr key={s.id} style={{background:"#fef9f9"}}><td style={{...td,fontWeight:"bold",color:"#b91c1c"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}>{s.class}</td><td style={{...td,fontWeight:"bold",color:"#b91c1c"}}>{s.avg}%</td><td style={td}><span style={{background:s.bg,color:s.col,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.grade}</span></td><td style={td}><span style={{fontSize:11,background:"#fee2e2",color:"#b91c1c",padding:"2px 10px",borderRadius:20}}>{s.avg<21?"Remedial Support":"Extra Tutoring"}</span></td></tr>)}{!atRisk.length&&<tr><td colSpan={6} style={{padding:30,textAlign:"center",color:"#15803d"}}>✅ All students are above the threshold!</td></tr>}</tbody></table></Card></>}

      {tab==="gender"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><Stat icon="👦" label="Boys Average" value={bAvg>0?bAvg.toFixed(1)+"%":"—"} color="#1d4ed8" sub={`${boys.length} male learners`}/><Stat icon="👧" label="Girls Average" value={gAvg>0?gAvg.toFixed(1)+"%":"—"} color="#be185d" sub={`${girls.length} female learners`}/></div><Card><div style={{fontWeight:"bold",color:"#1e293b",marginBottom:16,fontSize:13}}>Gender Performance Comparison</div>{(bAvg>0||gAvg>0)?<ResponsiveContainer width="100%" height={220}><BarChart data={[{name:"Average Score",Boys:parseFloat(bAvg.toFixed(1)),Girls:parseFloat(gAvg.toFixed(1))}]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip formatter={v=>[`${v}%`]}/><Legend/><Bar dataKey="Boys" fill="#1d4ed8" radius={[5,5,0,0]}/><Bar dataKey="Girls" fill="#be185d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<Empty icon="👫" text="No gender data in results"/>}</Card></>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// REPORT FORMS
// ══════════════════════════════════════════════════════════
function ReportsPage({students,results,comments,term,setTerm,year,setYear,examType,setExamType,logo}) {
  const [cls,setCls]=useState("Grade 7"); const [selId,setSelId]=useState("");
  const clsStu=students.filter(s=>s.class===cls).sort((a,b)=>a.name.localeCompare(b.name));
  const sel=selId?students.find(s=>s.id===selId):null;
  return (
    <div style={{padding:24}}>
      <PageH title="Report Forms" sub="Generate CBC learner progress report cards"/>
      <Card style={{marginBottom:18}}><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Sel label="CLASS" value={cls} onChange={v=>{setCls(v);setSelId("");}} options={ALL_CLASSES}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>STUDENT</label><select value={selId} onChange={e=>setSelId(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:F,minWidth:200}}><option value="">-- Select student --</option>{clsStu.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><Sel label="TERM" value={term} onChange={setTerm} options={TERMS}/><Sel label="EXAM TYPE" value={examType} onChange={setExamType} options={EXAM_TYPES}/><Sel label="YEAR" value={year} onChange={setYear} options={YEARS}/></div></Card>
      {sel?<ReportCard student={sel} results={results} comments={comments} term={term} year={year} examType={examType} logo={logo}/>:<Empty icon="📋" text="Select a student to view their report"/>}
    </div>
  );
}
function ReportCard({student,results,comments,term,year,examType,isParent,logo}) {
  const subs=getSubs(student.class);
  const sr=results.filter(r=>r.studentId===student.id&&r.term===term&&r.year===year&&r.examType===examType);
  const comment=(comments||[]).find(c=>c.studentId===student.id&&c.term===term&&c.year===year&&c.examType===examType);
  const avg=sr.length?sr.reduce((a,b)=>a+b.marks,0)/sr.length:0;
  const og=getGrade(avg);
  return (
    <Card style={{maxWidth:700,margin:"0 auto",fontFamily:F}}>
      <div style={{textAlign:"center",borderBottom:"2px solid #1e3a5f",paddingBottom:14,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:8}}><Logo size={64} src={logo}/><div><div style={{fontSize:18,fontWeight:"bold",color:"#1e3a5f"}}>{SCHOOL.name}</div><div style={{fontSize:11,color:"#64748b"}}>{SCHOOL.location}</div><div style={{fontSize:11,color:"#64748b"}}>{SCHOOL.phone} | {SCHOOL.email}</div><div style={{fontSize:11,fontStyle:"italic",color:"#15803d",fontWeight:"bold"}}>"{SCHOOL.motto}"</div></div></div>
        <div style={{fontSize:13,fontWeight:"bold",background:"#1e3a5f",color:"white",display:"inline-block",padding:"4px 20px",borderRadius:20,letterSpacing:1}}>{examType.toUpperCase()} — {term.toUpperCase()} {year}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}><div><b>Name:</b> {student.name}</div><div><b>Adm. No:</b> {student.admNo}</div><div><b>Class:</b> {student.class}</div><div><b>Gender:</b> {student.gender||"—"}</div><div><b>Term:</b> {term}</div><div><b>Year:</b> {year}</div></div>
        <Avatar name={student.name} photo={student.photo} size={72}/>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:14}}>
        <thead><tr style={{background:"#1e3a5f",color:"white"}}>{["Subject","Marks","Grade","Points","Remarks"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:12}}>{h}</th>)}</tr></thead>
        <tbody>
          {subs.map((s,i)=>{const r=sr.find(x=>x.subject===s); const g=r?getGrade(r.marks):null; return(<tr key={s} style={{background:i%2===0?"white":"#fafafa"}}><td style={{padding:"7px 12px",fontSize:12}}>{s}</td><td style={{padding:"7px 12px",fontSize:13,fontWeight:"bold",textAlign:"center"}}>{r?r.marks:"—"}</td><td style={{padding:"7px 12px"}}>{g?<span style={{background:g.bg,color:g.col,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{g.g}</span>:<span style={{color:"#94a3b8"}}>—</span>}</td><td style={{padding:"7px 12px",textAlign:"center",fontSize:12}}>{g?g.pts:"—"}</td><td style={{padding:"7px 12px",fontSize:11,color:"#64748b"}}>{g?g.lbl:"—"}</td></tr>);})}
        </tbody>
        <tfoot><tr style={{background:"#f0fdf4",fontWeight:"bold"}}><td style={{padding:"8px 12px",fontSize:12}}>TOTAL / AVERAGE</td><td style={{padding:"8px 12px",fontSize:14,fontWeight:"bold",textAlign:"center"}}>{avg>0?avg.toFixed(1):"—"}</td><td style={{padding:"8px 12px"}}>{avg>0?<span style={{background:og.bg,color:og.col,fontSize:12,padding:"3px 10px",borderRadius:20,fontWeight:"bold"}}>{og.g}</span>:"—"}</td><td style={{padding:"8px 12px",textAlign:"center",fontSize:12}}>{avg>0?og.pts:"—"}</td><td style={{padding:"8px 12px",fontSize:11}}>{avg>0?og.lbl:"—"}</td></tr></tfoot>
      </table>
      <div style={{border:"1px solid #e2e8f0",borderRadius:8,padding:12,marginBottom:14}}><div style={{fontSize:12,fontWeight:"bold",color:"#1e3a5f",marginBottom:6}}>Teacher's Comment</div><div style={{fontSize:12,color:"#374151",minHeight:36}}>{comment?comment.text:<i style={{color:"#94a3b8"}}>No comment recorded.</i>}</div>{comment&&<div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>— {comment.teacher} ({comment.date})</div>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:14}}>{["Class Teacher","Head Teacher","Parent/Guardian"].map(l=><div key={l} style={{textAlign:"center"}}><div style={{borderTop:"1px solid #374151",marginBottom:4,paddingTop:4,fontSize:11,color:"#64748b"}}>{l}</div></div>)}</div>
      <div style={{marginTop:14,background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:"bold",color:"#374151",marginBottom:4}}>CBC Grading Scale:</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[{g:"EE1",r:"90-100"},{g:"EE2",r:"75-89"},{g:"ME1",r:"58-74"},{g:"ME2",r:"41-57"},{g:"AE1",r:"31-40"},{g:"AE2",r:"21-30"},{g:"BE1",r:"11-20"},{g:"BE2",r:"0-10"}].map(({g,r})=>{const gd=getGrade(g==="EE1"?95:g==="EE2"?80:g==="ME1"?65:g==="ME2"?50:g==="AE1"?35:g==="AE2"?25:g==="BE1"?15:5); return <span key={g} style={{fontSize:9,background:gd.bg,color:gd.col,padding:"2px 6px",borderRadius:12,fontWeight:"bold"}}>{g}: {r}</span>;})}</div></div>
      {!isParent&&<div style={{marginTop:16,textAlign:"center"}}><Btn onClick={()=>window.print()} v="primary">🖨️ Print Report</Btn></div>}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════
// FEES MANAGER (with auto-calculated balance)
// ══════════════════════════════════════════════════════════
function FeesPage({students,fees,setFees,user}) {
  const blank={studentId:"",feeType:"School Fees",term:"Term 1",year:String(new Date().getFullYear()),amount:"",paid:"",payMethod:"Cash",payDate:new Date().toLocaleDateString("en-KE"),receipt:""};
  const [form,setForm]=useState(blank);
  const [msg,setMsg]=useState({t:"",ok:true});
  const [tab,setTab]=useState("list");
  const [filterCls,setFilterCls]=useState("All");
  const [search,setSearch]=useState("");
  const [filterTerm,setFilterTerm]=useState("All");
  const [filterYear,setFilterYear]=useState(String(new Date().getFullYear()));
  const [payModal,setPayModal]=useState(null); // fee record being paid
  const [payAmt,setPayAmt]=useState(""); const [payMethod2,setPayMethod2]=useState("M-Pesa"); const [payReceipt,setPayReceipt]=useState("");
  const [stuModal,setStuModal]=useState(null); // student id for statement
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};

  // Auto-calculated balance: balance = amount - paid (always computed, never stored)
  const getBalance = (f) => (parseFloat(f.amount)||0) - (parseFloat(f.paid)||0);

  function doAdd(){
    if(!form.studentId||!form.amount) return flash("Select student and enter amount due.",false);
    const amtDue=parseFloat(form.amount)||0;
    const amtPaid=parseFloat(form.paid)||0;
    if(amtPaid>amtDue) return flash("Amount paid cannot exceed amount due.",false);
    setFees(p=>[...p,{...form,id:Date.now().toString(),amount:amtDue,paid:amtPaid,addedBy:user.name}]);
    flash("✅ Fee record added! Balance auto-calculated.");
    setForm(blank);
  }

  function doRecordPayment(){
    if(!payModal) return;
    const extra=parseFloat(payAmt)||0;
    if(extra<=0) return flash("Enter a valid payment amount.",false);
    const currentBal=getBalance(payModal);
    if(extra>currentBal) return flash(`Payment KES ${extra.toLocaleString()} exceeds balance KES ${currentBal.toLocaleString()}.`,false);
    setFees(p=>p.map(f=>{
      if(f.id!==payModal.id) return f;
      return {...f, paid:(parseFloat(f.paid)||0)+extra, payMethod:payMethod2, payDate:new Date().toLocaleDateString("en-KE"), receipt:payReceipt||f.receipt};
    }));
    setPayModal(null); setPayAmt(""); setPayReceipt("");
    flash("✅ Payment recorded! Balance updated automatically.");
  }

  function doDelete(id){ setFees(p=>p.filter(f=>f.id!==id)); }

  // Filtered fees
  const filteredFees=(fees||[]).filter(f=>{
    const s=students.find(x=>x.id===f.studentId);
    return s&&(filterCls==="All"||s.class===filterCls)&&(filterTerm==="All"||f.term===filterTerm)&&(f.year===filterYear)&&(!search||s.name.toLowerCase().includes(search.toLowerCase()));
  });

  const tDue=filteredFees.reduce((a,b)=>a+(b.amount||0),0);
  const tPaid=filteredFees.reduce((a,b)=>a+(b.paid||0),0);
  const tBal=tDue-tPaid; // auto-calculated outstanding

  // Per-student summary
  const stuSummary=students.map(s=>{
    const sf=filteredFees.filter(f=>f.studentId===s.id);
    const due=sf.reduce((a,b)=>a+(b.amount||0),0);
    const paid=sf.reduce((a,b)=>a+(b.paid||0),0);
    return {student:s, due, paid, bal:due-paid, records:sf.length};
  }).filter(x=>x.records>0);

  // Students with outstanding balance
  const defaulters=stuSummary.filter(x=>x.bal>0).sort((a,b)=>b.bal-a.bal);

  // Student statement
  const stuStatement=stuModal?{student:stuModal, records:(fees||[]).filter(f=>f.studentId===stuModal.id)}:null;

  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};

  return (
    <div style={{padding:24}}>
      <PageH title="💰 Fees Manager" sub="Auto-calculated balances · Payments · Defaulters · Statements">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {user.role==="admin"&&<Btn onClick={()=>setTab(tab==="add"?"list":"add")} v={tab==="add"?"ghost":"primary"} style={{fontSize:12}}>{tab==="add"?"📋 Records":"➕ Add Record"}</Btn>}
          <Btn onClick={()=>setTab("summary")} v={tab==="summary"?"primary":"ghost"} style={{fontSize:12}}>👥 By Student</Btn>
          <Btn onClick={()=>setTab("defaulters")} v={tab==="defaulters"?"red":"ghost"} style={{fontSize:12}}>⚠️ Defaulters</Btn>
        </div>
      </PageH>

      {/* Auto-computed summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:18}}>
        <Stat icon="💳" label="Total Due" value={`KES ${tDue.toLocaleString()}`} color="#b45309" sub={`${filteredFees.length} records`}/>
        <Stat icon="✅" label="Total Paid" value={`KES ${tPaid.toLocaleString()}`} color="#15803d"/>
        <Stat icon="⚠️" label="Balance Outstanding" value={`KES ${tBal.toLocaleString()}`} color="#b91c1c" sub="auto-calculated"/>
        <Stat icon="📊" label="Collection Rate" value={tDue?((tPaid/tDue)*100).toFixed(1)+"%":"0%"} color="#7c3aed"/>
        <Stat icon="🚨" label="Defaulters" value={defaulters.length} color="#dc2626" sub="with balance > 0"/>
      </div>

      {/* Filters */}
      <Card style={{marginBottom:16,padding:"12px 16px"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:2,minWidth:160}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search student name..." style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:F,outline:"none",boxSizing:"border-box"}}/></div>
          <Sel value={filterCls} onChange={setFilterCls} options={["All",...ALL_CLASSES]}/>
          <Sel value={filterTerm} onChange={setFilterTerm} options={["All",...TERMS]}/>
          <Sel value={filterYear} onChange={setFilterYear} options={YEARS}/>
        </div>
      </Card>

      {/* ADD RECORD TAB */}
      {tab==="add"&&user.role==="admin"&&(
        <Card style={{marginBottom:18}}>
          <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:4,fontSize:15}}>➕ Add Fee Record</div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>💡 Balance is auto-calculated: <b>Balance = Amount Due − Amount Paid</b></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
            <div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>STUDENT *</label>
              <select value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}>
                <option value="">-- Select student --</option>
                {students.sort((a,b)=>a.name.localeCompare(b.name)).map(s=><option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
              </select>
            </div>
            <Sel label="FEE TYPE" value={form.feeType} onChange={v=>setForm({...form,feeType:v})} options={["School Fees","Activity Fees","Transport","Lunch","Uniform","Books","Exam Fee","Other"]}/>
            <Sel label="TERM" value={form.term} onChange={v=>setForm({...form,term:v})} options={TERMS}/>
            <Sel label="YEAR" value={form.year} onChange={v=>setForm({...form,year:v})} options={YEARS}/>
            <Inp label="AMOUNT DUE (KES) *" value={form.amount} onChange={v=>setForm({...form,amount:v})} placeholder="0" type="number"/>
            <div>
              <Inp label="AMOUNT PAID (KES)" value={form.paid} onChange={v=>setForm({...form,paid:v})} placeholder="0" type="number"/>
              {form.amount&&<div style={{fontSize:11,marginTop:4,color:"#7c3aed",fontWeight:"bold"}}>
                Auto Balance: KES {((parseFloat(form.amount)||0)-(parseFloat(form.paid)||0)).toLocaleString()}
              </div>}
            </div>
            <Sel label="PAYMENT METHOD" value={form.payMethod} onChange={v=>setForm({...form,payMethod:v})} options={["Cash","M-Pesa","Bank","Cheque"]}/>
            <Inp label="PAYMENT DATE" value={form.payDate} onChange={v=>setForm({...form,payDate:v})} placeholder="DD/MM/YYYY"/>
            <Inp label="RECEIPT NO." value={form.receipt} onChange={v=>setForm({...form,receipt:v})} placeholder="Receipt number"/>
          </div>
          {msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}
          <div style={{marginTop:14,display:"flex",gap:10}}><Btn onClick={doAdd} v="green">➕ Add Record</Btn><Btn onClick={()=>setTab("list")} v="ghost">📋 View All Records</Btn></div>
        </Card>
      )}

      {/* LIST TAB */}
      {tab==="list"&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>
            Fee Records — {filterYear} {filterTerm!=="All"?`· ${filterTerm}`:""} ({filteredFees.length} records)
          </div>
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:780}}>
            <thead><tr>{["Student","Class","Fee Type","Term","Amount Due","Amount Paid","Balance ⚡","Method","Date","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredFees.length?filteredFees.map((f,i)=>{
                const s=students.find(x=>x.id===f.studentId);
                const bal=getBalance(f); // AUTO-CALCULATED
                return(
                  <tr key={f.id} style={{background:i%2===0?"white":"#fafafa"}}>
                    <td style={{...td,fontWeight:"bold"}}>
                      <button onClick={()=>setStuModal(s)} style={{background:"none",border:"none",color:"#1d4ed8",cursor:"pointer",fontWeight:"bold",fontFamily:F,fontSize:12,padding:0,textDecoration:"underline"}}>{s?.name||"—"}</button>
                    </td>
                    <td style={td}>{s?.class||"—"}</td>
                    <td style={td}>{f.feeType}</td>
                    <td style={td}>{f.term}</td>
                    <td style={{...td,fontWeight:"bold",color:"#b45309"}}>KES {(f.amount||0).toLocaleString()}</td>
                    <td style={{...td,color:"#15803d",fontWeight:"bold"}}>KES {(f.paid||0).toLocaleString()}</td>
                    <td style={{...td,fontWeight:"bold",fontSize:13,color:bal>0?"#b91c1c":bal===0?"#15803d":"#7c3aed"}}>
                      {bal>0?`KES ${bal.toLocaleString()}`:bal===0?"✅ CLEAR":`OVERPAID`}
                    </td>
                    <td style={td}>{f.payMethod}</td>
                    <td style={td}>{f.payDate}</td>
                    <td style={td}>
                      <div style={{display:"flex",gap:6}}>
                        {bal>0&&user.role==="admin"&&<button onClick={()=>{setPayModal(f);setPayAmt("");setPayReceipt("");}} style={{background:"#15803d",color:"white",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:F}}>💳 Pay</button>}
                        {user.role==="admin"&&<button onClick={()=>doDelete(f.id)} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:11}}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                );
              }):<tr><td colSpan={10} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No records for the selected filter.</td></tr>}
              {filteredFees.length>0&&<tr style={{background:"#f0fdf4",fontWeight:"bold"}}>
                <td colSpan={4} style={{padding:"10px 12px",fontSize:12,color:"#15803d"}}>TOTALS ({filteredFees.length} records)</td>
                <td style={{padding:"10px 12px",fontSize:12,fontWeight:"bold",color:"#b45309"}}>KES {tDue.toLocaleString()}</td>
                <td style={{padding:"10px 12px",fontSize:12,fontWeight:"bold",color:"#15803d"}}>KES {tPaid.toLocaleString()}</td>
                <td style={{padding:"10px 12px",fontSize:12,fontWeight:"bold",color:tBal>0?"#b91c1c":"#15803d"}}>KES {tBal.toLocaleString()}</td>
                <td colSpan={3}/>
              </tr>}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* PER-STUDENT SUMMARY TAB */}
      {tab==="summary"&&(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>
            Per-Student Fee Summary — {filterYear} {filterTerm!=="All"?`· ${filterTerm}`:""} ({stuSummary.length} students)
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["#","Student","Class","Total Due","Total Paid","Balance ⚡","Status","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {stuSummary.length?stuSummary.map((x,i)=>(
                <tr key={x.student.id} style={{background:i%2===0?"white":"#fafafa"}}>
                  <td style={{...td,color:"#94a3b8"}}>{i+1}</td>
                  <td style={{...td,fontWeight:"bold"}}>
                    <button onClick={()=>setStuModal(x.student)} style={{background:"none",border:"none",color:"#1d4ed8",cursor:"pointer",fontWeight:"bold",fontFamily:F,fontSize:12,padding:0,textDecoration:"underline"}}>{x.student.name}</button>
                  </td>
                  <td style={td}>{x.student.class}</td>
                  <td style={{...td,color:"#b45309",fontWeight:"bold"}}>KES {x.due.toLocaleString()}</td>
                  <td style={{...td,color:"#15803d",fontWeight:"bold"}}>KES {x.paid.toLocaleString()}</td>
                  <td style={{...td,fontWeight:"bold",fontSize:13,color:x.bal>0?"#b91c1c":"#15803d"}}>
                    {x.bal>0?`KES ${x.bal.toLocaleString()}`:"✅ CLEAR"}
                  </td>
                  <td style={td}>
                    <span style={{fontSize:10,padding:"2px 10px",borderRadius:20,fontWeight:"bold",background:x.bal>0?"#fee2e2":"#dcfce7",color:x.bal>0?"#b91c1c":"#15803d"}}>
                      {x.bal>0?"Owes":"Cleared"}
                    </span>
                  </td>
                  <td style={td}><button onClick={()=>setStuModal(x.student)} style={{color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",fontSize:11}}>View Statement</button></td>
                </tr>
              )):<tr><td colSpan={8} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No records for this filter.</td></tr>}
              {stuSummary.length>0&&<tr style={{background:"#f0fdf4",fontWeight:"bold"}}>
                <td colSpan={3} style={{padding:"10px 12px",fontSize:12,color:"#15803d"}}>TOTALS ({stuSummary.length} students)</td>
                <td style={{padding:"10px 12px",color:"#b45309"}}>KES {stuSummary.reduce((a,b)=>a+b.due,0).toLocaleString()}</td>
                <td style={{padding:"10px 12px",color:"#15803d"}}>KES {stuSummary.reduce((a,b)=>a+b.paid,0).toLocaleString()}</td>
                <td style={{padding:"10px 12px",color:"#b91c1c"}}>KES {stuSummary.reduce((a,b)=>a+b.bal,0).toLocaleString()}</td>
                <td colSpan={2}/>
              </tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* DEFAULTERS TAB */}
      {tab==="defaulters"&&(
        <><div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#b91c1c"}}>
          🚨 <b>{defaulters.length} student(s)</b> have outstanding fee balances totalling <b>KES {defaulters.reduce((a,b)=>a+b.bal,0).toLocaleString()}</b>. Balances are auto-calculated.
        </div>
        <Card style={{padding:0,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Rank","Student","Class","Total Due","Total Paid","Balance ⚡","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {defaulters.length?defaulters.map((x,i)=>(
                <tr key={x.student.id} style={{background:i%2===0?"#fef9f9":"white"}}>
                  <td style={{...td,fontWeight:"bold",color:"#b91c1c"}}>{i+1}</td>
                  <td style={{...td,fontWeight:"bold"}}>{x.student.name}</td>
                  <td style={td}>{x.student.class}</td>
                  <td style={{...td,color:"#b45309",fontWeight:"bold"}}>KES {x.due.toLocaleString()}</td>
                  <td style={{...td,color:"#15803d",fontWeight:"bold"}}>KES {x.paid.toLocaleString()}</td>
                  <td style={{...td,fontWeight:"bold",color:"#b91c1c",fontSize:14}}>KES {x.bal.toLocaleString()}</td>
                  <td style={td}><button onClick={()=>setStuModal(x.student)} style={{color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",fontSize:11}}>View Statement</button></td>
                </tr>
              )):<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#15803d"}}>✅ No defaulters! All students cleared.</td></tr>}
            </tbody>
          </table>
        </Card></>
      )}

      {/* PAYMENT MODAL */}
      {payModal&&(()=>{
        const s=students.find(x=>x.id===payModal.studentId);
        const currentBal=getBalance(payModal);
        return(
          <Modal title={`💳 Record Payment — ${s?.name}`} onClose={()=>setPayModal(null)}>
            <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:13}}>
                <div><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>FEE TYPE</div><div style={{fontWeight:"bold"}}>{payModal.feeType}</div></div>
                <div><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>TERM</div><div style={{fontWeight:"bold"}}>{payModal.term} {payModal.year}</div></div>
                <div><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>AMOUNT DUE</div><div style={{fontWeight:"bold",color:"#b45309"}}>KES {(payModal.amount||0).toLocaleString()}</div></div>
                <div><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>ALREADY PAID</div><div style={{fontWeight:"bold",color:"#15803d"}}>KES {(payModal.paid||0).toLocaleString()}</div></div>
                <div><div style={{fontSize:10,color:"#64748b",marginBottom:2}}>BALANCE ⚡</div><div style={{fontWeight:"bold",color:"#b91c1c",fontSize:16}}>KES {currentBal.toLocaleString()}</div></div>
              </div>
            </div>
            <div style={{display:"grid",gap:12,marginBottom:14}}>
              <div>
                <Inp label={`PAYMENT AMOUNT (KES) — Max KES ${currentBal.toLocaleString()}`} value={payAmt} onChange={v=>setPayAmt(v)} placeholder="0" type="number"/>
                {payAmt&&parseFloat(payAmt)>0&&<div style={{marginTop:6,fontSize:12,fontWeight:"bold",color:"#7c3aed"}}>
                  New balance after payment: <span style={{color:currentBal-parseFloat(payAmt)>0?"#b91c1c":"#15803d"}}>KES {Math.max(0,currentBal-(parseFloat(payAmt)||0)).toLocaleString()}</span>
                </div>}
              </div>
              <Sel label="PAYMENT METHOD" value={payMethod2} onChange={setPayMethod2} options={["Cash","M-Pesa","Bank","Cheque"]}/>
              <Inp label="RECEIPT NO. (optional)" value={payReceipt} onChange={setPayReceipt} placeholder="e.g. RCP-001"/>
            </div>
            {msg.t&&<div style={{marginBottom:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}
            <div style={{display:"flex",gap:10}}><Btn onClick={doRecordPayment} v="green" full>✅ Record Payment & Update Balance</Btn></div>
          </Modal>
        );
      })()}

      {/* STUDENT STATEMENT MODAL */}
      {stuModal&&(()=>{
        const sf=(fees||[]).filter(f=>f.studentId===stuModal.id);
        const sDue=sf.reduce((a,b)=>a+(b.amount||0),0);
        const sPaid=sf.reduce((a,b)=>a+(b.paid||0),0);
        const sBal=sDue-sPaid;
        return(
          <Modal title={`📋 Fee Statement — ${stuModal.name}`} onClose={()=>setStuModal(null)} wide>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1,background:"#eff6ff",borderRadius:10,padding:"10px 14px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b"}}>Total Due</div><div style={{fontWeight:"bold",color:"#b45309",fontSize:16}}>KES {sDue.toLocaleString()}</div></div>
              <div style={{flex:1,background:"#f0fdf4",borderRadius:10,padding:"10px 14px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b"}}>Total Paid</div><div style={{fontWeight:"bold",color:"#15803d",fontSize:16}}>KES {sPaid.toLocaleString()}</div></div>
              <div style={{flex:1,background:sBal>0?"#fef2f2":"#f0fdf4",borderRadius:10,padding:"10px 14px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b"}}>Balance ⚡</div><div style={{fontWeight:"bold",color:sBal>0?"#b91c1c":"#15803d",fontSize:18}}>KES {sBal.toLocaleString()}</div><div style={{fontSize:10,color:"#94a3b8"}}>auto-calculated</div></div>
            </div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{stuModal.class} · Adm: {stuModal.admNo}</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Fee Type","Term","Year","Due","Paid","Balance ⚡","Method","Receipt","Date"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 10px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"}}>{h}</th>)}</tr></thead>
              <tbody>
                {sf.length?sf.map((f,i)=>{const b=getBalance(f); return(<tr key={f.id} style={{background:i%2===0?"white":"#fafafa"}}>
                  <td style={{padding:"7px 10px",fontSize:12}}>{f.feeType}</td>
                  <td style={{padding:"7px 10px",fontSize:12}}>{f.term}</td>
                  <td style={{padding:"7px 10px",fontSize:12}}>{f.year}</td>
                  <td style={{padding:"7px 10px",fontSize:12,color:"#b45309",fontWeight:"bold"}}>KES {(f.amount||0).toLocaleString()}</td>
                  <td style={{padding:"7px 10px",fontSize:12,color:"#15803d",fontWeight:"bold"}}>KES {(f.paid||0).toLocaleString()}</td>
                  <td style={{padding:"7px 10px",fontSize:13,fontWeight:"bold",color:b>0?"#b91c1c":"#15803d"}}>{b>0?`KES ${b.toLocaleString()}`:"✅"}</td>
                  <td style={{padding:"7px 10px",fontSize:12}}>{f.payMethod||"—"}</td>
                  <td style={{padding:"7px 10px",fontSize:11,fontFamily:"monospace"}}>{f.receipt||"—"}</td>
                  <td style={{padding:"7px 10px",fontSize:12}}>{f.payDate||"—"}</td>
                </tr>);}):<tr><td colSpan={9} style={{padding:24,textAlign:"center",color:"#94a3b8"}}>No fee records for this student.</td></tr>}
              </tbody>
            </table>
            <div style={{marginTop:16,textAlign:"right"}}><Btn onClick={()=>window.print()} v="primary" style={{fontSize:12}}>🖨️ Print Statement</Btn></div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TIMETABLE SETUP (classes, subjects, teachers, class teacher)
// ══════════════════════════════════════════════════════════
function TimetableSetup({staff,setupData,setSetupData}) {
  const [tab,setTab]=useState("classes");
  const [msg,setMsg]=useState({t:"",ok:true});
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2800);};

  // ── Classes tab ──────────────────────────────────────────
  const [clsForm,setClsForm]=useState({name:"",stream:"",classTeacherId:""});
  const teachingStaff=(staff||[]).filter(s=>s.staffType==="teaching");
  const classes=setupData.classes||[];
  function addClass(){
    if(!clsForm.name) return flash("Select a class.",false);
    if(classes.find(c=>c.name===clsForm.name&&c.stream===clsForm.stream)) return flash("Class/stream already exists.",false);
    const ct=teachingStaff.find(s=>s.id===clsForm.classTeacherId);
    const nc={id:Date.now().toString(),name:clsForm.name,stream:clsForm.stream||"",classTeacherId:clsForm.classTeacherId,classTeacherName:ct?.name||"",subjects:setupData.classes?.find(c=>c.name===clsForm.name)?.subjects||getSubs(clsForm.name).map(sub=>({subject:sub,teacherId:"",teacherName:""}))};
    setSetupData(p=>({...p,classes:[...(p.classes||[]),nc]}));
    flash("✅ Class added!"); setClsForm({name:"",stream:"",classTeacherId:""});
  }
  function removeClass(id){setSetupData(p=>({...p,classes:(p.classes||[]).filter(c=>c.id!==id)}));}
  function setClassTeacher(classId,teacherId){
    const ct=teachingStaff.find(s=>s.id===teacherId);
    setSetupData(p=>({...p,classes:(p.classes||[]).map(c=>c.id===classId?{...c,classTeacherId:teacherId,classTeacherName:ct?.name||""}:c)}));
  }

  // ── Subject-teachers tab ─────────────────────────────────
  const [selClassId,setSelClassId]=useState("");
  const selClass=classes.find(c=>c.id===selClassId);
  function setSubTeacher(classId,subIdx,teacherId){
    const t=teachingStaff.find(s=>s.id===teacherId);
    setSetupData(p=>({...p,classes:(p.classes||[]).map(c=>{if(c.id!==classId) return c; const subs=[...(c.subjects||[])]; subs[subIdx]={...subs[subIdx],teacherId,teacherName:t?.name||""}; return {...c,subjects:subs};})}));
  }
  function addSubject(classId,subName){
    if(!subName.trim()) return;
    setSetupData(p=>({...p,classes:(p.classes||[]).map(c=>{if(c.id!==classId) return c; const already=(c.subjects||[]).find(s=>s.subject===subName); if(already) return c; return {...c,subjects:[...(c.subjects||[]),{subject:subName,teacherId:"",teacherName:""}]};})})  );
  }
  function removeSubject(classId,subIdx){
    setSetupData(p=>({...p,classes:(p.classes||[]).map(c=>{if(c.id!==classId) return c; const subs=[...(c.subjects||[])]; subs.splice(subIdx,1); return {...c,subjects:subs};})}));
  }
  const [newSub,setNewSub]=useState("");

  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["classes","🏫 Classes"],["subjects","📚 Subjects & Teachers"],["summary","📋 Summary"]].map(([t,l])=>(
          <Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>
        ))}
      </div>
      {msg.t&&<div style={{background:msg.ok?"#f0fdf4":"#fef2f2",border:`1px solid ${msg.ok?"#bbf7d0":"#fecaca"}`,borderRadius:8,padding:"10px 16px",marginBottom:14,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold",fontSize:13}}>{msg.t}</div>}

      {tab==="classes"&&<>
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>➕ Add Class</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
            <Sel label="CLASS *" value={clsForm.name} onChange={v=>setClsForm({...clsForm,name:v})} options={["Select...", ...ALL_CLASSES]}/>
            <Inp label="STREAM (optional)" value={clsForm.stream} onChange={v=>setClsForm({...clsForm,stream:v})} placeholder="e.g. North, East"/>
            <div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>CLASS TEACHER</label>
              <select value={clsForm.classTeacherId} onChange={e=>setClsForm({...clsForm,classTeacherId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"white",fontFamily:F}}>
                <option value="">-- Assign later --</option>
                {teachingStaff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginTop:14}}><Btn onClick={addClass} v="primary">➕ Add Class</Btn></div>
        </Card>

        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>Configured Classes ({classes.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Class","Stream","Class Teacher","Subjects","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {classes.length?classes.map((c,i)=>(
                <tr key={c.id} style={{background:i%2===0?"white":"#fafafa"}}>
                  <td style={{...td,fontWeight:"bold"}}>{c.name}</td>
                  <td style={td}>{c.stream||<span style={{color:"#94a3b8"}}>—</span>}</td>
                  <td style={td}>
                    <select value={c.classTeacherId||""} onChange={e=>setClassTeacher(c.id,e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:F,minWidth:140}}>
                      <option value="">-- Not assigned --</option>
                      {teachingStaff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td style={td}><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{(c.subjects||[]).length} subjects</span></td>
                  <td style={td}><button onClick={()=>removeClass(c.id)} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:12}}>Remove</button></td>
                </tr>
              )):<tr><td colSpan={5} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No classes added yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </>}

      {tab==="subjects"&&<>
        <Card style={{marginBottom:14}}>
          <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:10,fontSize:14}}>Select Class to Configure</div>
          <select value={selClassId} onChange={e=>setSelClassId(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F,minWidth:200}}>
            <option value="">-- Select a class --</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name}{c.stream?` (${c.stream})`:""}</option>)}
          </select>
        </Card>
        {selClass&&<>
          <Card style={{marginBottom:14}}>
            <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:10,fontSize:14}}>➕ Add Subject to {selClass.name}{selClass.stream?` (${selClass.stream})`:""}</div>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <Inp label="SUBJECT NAME" value={newSub} onChange={setNewSub} placeholder="e.g. Computer Studies"/>
              </div>
              <Btn onClick={()=>{addSubject(selClass.id,newSub.trim());setNewSub("");}} v="green">Add Subject</Btn>
            </div>
            <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
              {getSubs(selClass.name).map(s=><button key={s} onClick={()=>addSubject(selClass.id,s)} style={{background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:F}}>{s}</button>)}
            </div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>☝️ Quick-add CBC subjects for this level</div>
          </Card>
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>{selClass.name}{selClass.stream?` (${selClass.stream})`:""} — Subjects & Teachers</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["#","Subject","Subject Teacher","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {(selClass.subjects||[]).length?(selClass.subjects||[]).map((s,i)=>(
                  <tr key={i} style={{background:i%2===0?"white":"#fafafa"}}>
                    <td style={{...td,color:"#94a3b8"}}>{i+1}</td>
                    <td style={{...td,fontWeight:"bold"}}>{s.subject}</td>
                    <td style={td}>
                      <select value={s.teacherId||""} onChange={e=>setSubTeacher(selClass.id,i,e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:F,minWidth:160}}>
                        <option value="">-- Not assigned --</option>
                        {teachingStaff.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td style={td}><button onClick={()=>removeSubject(selClass.id,i)} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:12}}>✕</button></td>
                  </tr>
                )):<tr><td colSpan={4} style={{padding:24,textAlign:"center",color:"#94a3b8"}}>No subjects yet. Add some above.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>}
        {!selClass&&classes.length===0&&<Empty icon="🏫" text="Add classes first in the 'Classes' tab."/>}
      </>}

      {tab==="summary"&&<>
        {classes.length?<div style={{display:"grid",gap:14}}>
          {classes.map(c=>{
            const noTeacher=(c.subjects||[]).filter(s=>!s.teacherId).length;
            const ct=c.classTeacherName;
            return (
              <Card key={c.id} style={{borderLeft:`4px solid ${ct?"#15803d":"#e2e8f0"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:15}}>{c.name}{c.stream?` — ${c.stream}`:""}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                      <span style={{marginRight:12}}>🧑‍🏫 Class Teacher: <b style={{color:ct?"#15803d":"#b91c1c"}}>{ct||"Not assigned"}</b></span>
                      <span>📚 {(c.subjects||[]).length} subjects</span>
                    </div>
                  </div>
                  {noTeacher>0&&<span style={{background:"#fef3c7",color:"#b45309",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:"bold"}}>⚠️ {noTeacher} unassigned</span>}
                  {noTeacher===0&&(c.subjects||[]).length>0&&<span style={{background:"#dcfce7",color:"#15803d",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:"bold"}}>✅ Complete</span>}
                </div>
                <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
                  {(c.subjects||[]).map((s,i)=>(
                    <div key={i} style={{background:s.teacherName?"#eff6ff":"#fef2f2",border:`1px solid ${s.teacherName?"#bfdbfe":"#fecaca"}`,borderRadius:8,padding:"4px 10px",fontSize:11}}>
                      <div style={{fontWeight:"bold",color:"#1e3a5f"}}>{s.subject}</div>
                      <div style={{color:s.teacherName?"#1d4ed8":"#b91c1c"}}>{s.teacherName||"⚠️ No teacher"}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>:<Empty icon="🏫" text="No classes configured yet. Start in the 'Classes' tab."/>}
      </>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AUTO TIMETABLE (no collision)
// ══════════════════════════════════════════════════════════
function TimetablePage({students,staff,user}) {
  const [tt,setTt]=useState({}); const [cfg,setCfg]=useState(DEFAULT_CFG); const [tab,setTab]=useState("view");
  const [selCls,setSelCls]=useState("Grade 7"); const [editCell,setEditCell]=useState(null); const [editVal,setEditVal]=useState({subject:"",teacher:""});
  const [cfgEdit,setCfgEdit]=useState({...DEFAULT_CFG}); const [msg,setMsg]=useState("");
  const [setupData,setSetupData]=useState({classes:[]});
  useEffect(()=>{(async()=>{const d=await loadSetting("timetable");if(d)setTt(d); const d2=await loadSetting("ttcfg");if(d2){const cfgWithBreaks={...DEFAULT_CFG,...d2,breaks:d2.breaks||[{afterLesson:d2.breakAfter||4,name:"Break",mins:d2.breakMins||20}]};setCfg(cfgWithBreaks);setCfgEdit(cfgWithBreaks);} const d3=await loadSetting("ttsetup");if(d3)setSetupData(d3);})();},[]);
  useEffect(()=>{if(Object.keys(tt).length>0) saveSetting("timetable",tt);},[tt]);
  useEffect(()=>{saveSetting("ttsetup",setupData);},[setupData]);
  const slots=makeTimeSlots(cfg);
  const allTeachers=[...new Set((staff||[]).filter(s=>s.staffType==="teaching").map(s=>s.name))];

  function autoGen() {
    const busy={}; const gen={};
    ALL_CLASSES.forEach(cls=>{gen[cls]={};DAYS.forEach(d=>{gen[cls][d]=[];});});
    // Use setup data assignments if available, fall back to staff subject matching
    const getTeacherForClass=(cls,sub)=>{
      const sc=(setupData.classes||[]).find(c=>c.name===cls);
      if(sc){const ss=(sc.subjects||[]).find(s=>s.subject===sub); if(ss&&ss.teacherName) return ss.teacherName;}
      const m=(staff||[]).find(s=>s.staffType==="teaching"&&s.subject&&(s.subject===sub||s.subject.toLowerCase().split(/[,;/]/).some(x=>sub.toLowerCase().includes(x.trim().toLowerCase())))); return m?m.name:"TBD";
    };
    const getTeacher=(sub)=>{const m=(staff||[]).find(s=>s.staffType==="teaching"&&s.subject&&(s.subject===sub||s.subject.toLowerCase().split(/[,;/]/).some(x=>sub.toLowerCase().includes(x.trim().toLowerCase())))); return m?m.name:"TBD";};
    // Determine classes to generate: use setupData classes if configured, else ALL_CLASSES
    const configuredClasses=(setupData.classes||[]).length>0?(setupData.classes||[]).map(c=>c.name):ALL_CLASSES;
    const uniqueClasses=[...new Set(configuredClasses)];
    uniqueClasses.forEach(cls=>{if(!gen[cls]){gen[cls]={};DAYS.forEach(d=>{gen[cls][d]=[];})}});
    ALL_CLASSES.forEach(cls=>{gen[cls]={};DAYS.forEach(d=>{gen[cls][d]=[];});});
    ALL_CLASSES.forEach(cls=>{
      // Get subjects from setup data if available, else CBC defaults
      const sc=(setupData.classes||[]).find(c=>c.name===cls);
      const subs=sc&&(sc.subjects||[]).length>0?(sc.subjects||[]).map(s=>s.subject):getSubs(cls); let si=0;
      DAYS.forEach(day=>{
        for(let p=0;p<cfg.lessons;p++){
          let placed=false;
          for(let attempt=0;attempt<subs.length*3&&!placed;attempt++){
            const sub=subs[(si+attempt)%subs.length];
            const teacher=getTeacherForClass(cls,sub);
            const k=`${teacher}-${day}-${p}`;
            if(teacher==="TBD"||!busy[k]){
              gen[cls][day].push({subject:sub,teacher});
              if(teacher!=="TBD") busy[k]=cls;
              si=(si+attempt+1)%subs.length; placed=true;
            }
          }
          if(!placed) gen[cls][day].push({subject:subs[p%subs.length],teacher:"TBD"});
        }
      });
    });
    setTt(gen); setMsg("✅ Timetable auto-generated with collision detection!"); setTimeout(()=>setMsg(""),3500);
  }
  function saveCfg(){const u={lessons:parseInt(cfgEdit.lessons)||8,duration:parseInt(cfgEdit.duration)||40,startH:parseInt(cfgEdit.startH)||7,startM:parseInt(cfgEdit.startM)||30,breaks:(cfgEdit.breaks||[]).map(b=>({name:b.name||"Break",afterLesson:parseInt(b.afterLesson)||4,mins:parseInt(b.mins)||20}))}; setCfg(u); saveSetting("ttcfg",u); setMsg("✅ Config saved!"); setTimeout(()=>setMsg(""),2500);}
  function updCell(cls,day,p,val){setTt(prev=>{const n={...prev,[cls]:{...(prev[cls]||{})}}; DAYS.forEach(d=>{if(!n[cls][d]) n[cls][d]=(prev[cls]?.[d]||[]).slice();}); const arr=[...(n[cls][day]||[])]; arr[p]=val; n[cls][day]=arr; return n;});}
  const colMap={};
  const palette=["#dbeafe","#d1fae5","#fef3c7","#fee2e2","#f3e8ff","#ccfbf1","#fce7f3","#e0f2fe","#fef9c3","#ffe4e6","#ecfdf5","#faf5ff"];
  getSubs(selCls).forEach((s,i)=>{colMap[s]=palette[i%palette.length];});
  const clsTT=tt[selCls]||{};
  return (
    <div style={{padding:24}}>
      <PageH title="🗓️ Timetable" sub="Auto-generated timetable with teacher collision detection">
        {user?.role==="admin"&&<Btn onClick={autoGen} v="green" style={{fontSize:12}}>⚡ Auto-Generate All Classes</Btn>}
      </PageH>
      {msg&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 16px",marginBottom:16,color:"#15803d",fontWeight:"bold",fontSize:13}}>{msg}</div>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["view","📅 Timetable"],["setup","🏫 Setup"],["config","⚙️ Configure"],user?.role==="admin"&&["assign","👨‍🏫 Assignments"]].filter(Boolean).map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}
      </div>

      {tab==="setup"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:16,fontSize:14}}>🏫 Timetable Setup</div><div style={{fontSize:12,color:"#64748b",marginBottom:14,background:"#eff6ff",borderRadius:8,padding:"10px 14px"}}>Configure your classes, assign subjects per class, set subject teachers and class teachers. The auto-generator will use these assignments.</div><TimetableSetup staff={staff} setupData={setupData} setSetupData={setSetupData}/></Card>}
      {tab==="config"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:16,fontSize:14}}>⚙️ Timetable Configuration</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:18}}>
          {[["LESSONS PER DAY","lessons",4,12],["LESSON DURATION (min)","duration",20,90],["START HOUR (24hr)","startH",6,9],["START MINUTE","startM",0,59]].map(([label,key,min,max])=><div key={key}><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>{label}</label><input type="number" min={min} max={max} value={cfgEdit[key]} onChange={e=>setCfgEdit({...cfgEdit,[key]:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F}}/></div>)}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:13,marginBottom:10}}>🕐 Breaks</div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Add as many breaks as you need. Each break is inserted before the specified lesson number.</div>
          {(cfgEdit.breaks||[]).map((br,bi)=>(
            <div key={bi} style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:8,background:"#eff6ff",borderRadius:8,padding:"10px 12px",flexWrap:"wrap"}}>
              <div><label style={{fontSize:10,fontWeight:"bold",color:"#374151",display:"block",marginBottom:2}}>BREAK NAME</label><input value={br.name||""} onChange={e=>{const nb=[...(cfgEdit.breaks||[])];nb[bi]={...nb[bi],name:e.target.value};setCfgEdit({...cfgEdit,breaks:nb});}} placeholder="e.g. Morning Break" style={{border:"1.5px solid #e2e8f0",borderRadius:7,padding:"6px 10px",fontSize:12,fontFamily:F,width:140}}/></div>
              <div><label style={{fontSize:10,fontWeight:"bold",color:"#374151",display:"block",marginBottom:2}}>AFTER LESSON #</label><input type="number" min={1} max={cfgEdit.lessons||8} value={br.afterLesson||""} onChange={e=>{const nb=[...(cfgEdit.breaks||[])];nb[bi]={...nb[bi],afterLesson:e.target.value};setCfgEdit({...cfgEdit,breaks:nb});}} style={{border:"1.5px solid #e2e8f0",borderRadius:7,padding:"6px 10px",fontSize:12,fontFamily:F,width:80}}/></div>
              <div><label style={{fontSize:10,fontWeight:"bold",color:"#374151",display:"block",marginBottom:2}}>DURATION (min)</label><input type="number" min={5} max={120} value={br.mins||""} onChange={e=>{const nb=[...(cfgEdit.breaks||[])];nb[bi]={...nb[bi],mins:e.target.value};setCfgEdit({...cfgEdit,breaks:nb});}} style={{border:"1.5px solid #e2e8f0",borderRadius:7,padding:"6px 10px",fontSize:12,fontFamily:F,width:80}}/></div>
              <Btn onClick={()=>{const nb=(cfgEdit.breaks||[]).filter((_,i)=>i!==bi);setCfgEdit({...cfgEdit,breaks:nb});}} v="red" style={{fontSize:11,padding:"6px 10px"}}>✕ Remove</Btn>
            </div>
          ))}
          <Btn onClick={()=>setCfgEdit({...cfgEdit,breaks:[...(cfgEdit.breaks||[]),{name:"Break",afterLesson:4,mins:20}]})} v="ghost" style={{fontSize:12}}>➕ Add Break</Btn>
        </div>
        {msg&&<div style={{marginTop:10,fontSize:13,color:"#15803d",fontWeight:"bold"}}>{msg}</div>}<div style={{marginTop:14}}><Btn onClick={saveCfg} v="primary">💾 Save Config</Btn></div></Card>}

      {tab==="view"&&<>
        <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}><Sel value={selCls} onChange={setSelCls} options={ALL_CLASSES}/><span style={{fontSize:12,color:"#64748b"}}>Duration: {cfg.duration} min per lesson · {cfg.lessons} lessons/day</span></div>
        {editCell&&<Modal title={`Edit: ${selCls} — ${editCell.day} P${editCell.p+1}`} onClose={()=>setEditCell(null)}><div style={{display:"grid",gap:12}}><Sel label="SUBJECT" value={editVal.subject} onChange={v=>setEditVal({...editVal,subject:v})} options={["Free/Break",...getSubs(selCls)]}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>TEACHER</label><select value={editVal.teacher} onChange={e=>setEditVal({...editVal,teacher:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="TBD">TBD</option>{allTeachers.map(t=><option key={t} value={t}>{t}</option>)}<option value="External">External</option></select></div></div><div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={()=>{updCell(selCls,editCell.day,editCell.p,editVal);setEditCell(null);}} v="primary">Save</Btn><Btn onClick={()=>setEditCell(null)} v="ghost">Cancel</Btn></div></Modal>}
        {Object.keys(clsTT).length?<><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}><thead><tr style={{background:"#1e3a5f"}}><th style={{padding:"10px 14px",color:"white",fontSize:12,textAlign:"left",width:60}}>P.</th><th style={{padding:"10px 14px",color:"white",fontSize:11,textAlign:"left",width:90}}>Time</th>{DAYS.map(d=><th key={d} style={{padding:"10px 14px",color:"white",fontSize:12,textAlign:"center"}}>{d}</th>)}</tr></thead><tbody>{slots.map((time,p)=><tr key={p} style={{borderBottom:"1px solid #f1f5f9"}}><td style={{padding:"8px 14px",fontWeight:"bold",color:"#1d4ed8",fontSize:12}}>{p+1}</td><td style={{padding:"8px 14px",fontSize:10,color:"#64748b",fontFamily:"monospace"}}>{time}</td>{DAYS.map(day=>{const slot=(clsTT[day]||[])[p]; const bg=slot&&slot.subject!=="Free/Break"?colMap[slot.subject]||"#f8fafc":"#f8fafc"; return(<td key={day} style={{padding:5}}><div onClick={()=>{if(user?.role==="admin"){setEditCell({day,p});setEditVal(slot||{subject:getSubs(selCls)[0],teacher:"TBD"});}}} style={{background:bg,borderRadius:8,padding:"6px 4px",cursor:user?.role==="admin"?"pointer":"default",minHeight:48,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} title={user?.role==="admin"?"Click to edit":""}><div style={{fontSize:11,fontWeight:"bold",color:"#1e3a5f",textAlign:"center"}}>{slot?.subject?.split(" ").slice(0,2).join(" ")||"—"}</div><div style={{fontSize:9,color:"#64748b",marginTop:2,textAlign:"center"}}>{slot?.teacher||""}</div></div></td>);})} </tr>)}</tbody></table></div><div style={{marginTop:12}}><div style={{fontSize:12,fontWeight:"bold",color:"#1e3a5f",marginBottom:8}}>Legend</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{getSubs(selCls).map(s=><span key={s} style={{fontSize:11,background:colMap[s]||"#f8fafc",padding:"3px 10px",borderRadius:20,color:"#1e3a5f",fontWeight:"bold",border:"1px solid rgba(0,0,0,.08)"}}>{s.split(" ")[0]}</span>)}</div></div>{user?.role==="admin"&&<div style={{marginTop:6,fontSize:11,color:"#94a3b8"}}>ℹ️ Click any cell to edit</div>}</>:<Empty icon="📅" text="No timetable yet. Click 'Auto-Generate All Classes' to create one."/>}
      </>}
      {tab==="term"&&<div>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <Sel value={form.term} onChange={v=>setForm({...form,term:v})} options={TERMS} label="FILTER BY TERM"/>
        </div>
        {DUTY_TYPES.map(dt=>{const termDuties=duties.filter(d=>d.dutyType===dt&&d.term===form.term); if(!termDuties.length) return null; return(
          <Card key={dt} style={{marginBottom:12,padding:"14px 18px"}}>
            <div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:13,marginBottom:10,borderBottom:"1px solid #eff6ff",paddingBottom:6}}>🛡️ {dt}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
              {DAYS.map(day=>{const dd=termDuties.filter(d=>d.day===day); return dd.length?(<div key={day} style={{background:"#eff6ff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,fontWeight:"bold",color:"#1d4ed8",marginBottom:4}}>{day}</div>{dd.map(d=><div key={d.id} style={{fontSize:12,marginBottom:2}}><span style={{fontWeight:"bold"}}>{d.teacherName}</span><span style={{color:"#64748b",fontSize:11}}> · {d.startTime}–{d.endTime}</span>{user?.role==="admin"&&<button onClick={()=>setDuties(p=>p.filter(y=>y.id!==d.id))} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:10,marginLeft:4}}>✕</button>}</div>)}</div>):null;})}
            </div>
          </Card>
        );})}
        {!duties.filter(d=>d.term===form.term).length&&<Empty icon="🛡️" text="No duties assigned for this term yet."/>}
      </div>}
      {tab==="assign"&&user?.role==="admin"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:12}}>Teacher-Subject Assignments</div><div style={{fontSize:12,color:"#64748b",marginBottom:14,background:"#eff6ff",borderRadius:8,padding:"10px 14px"}}>Assignments come from the <b>Staff Manager → Subject/Dept</b> field. The auto-generator reads this to assign teachers.</div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Teacher","Subject","Type"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"}}>{h}</th>)}</tr></thead><tbody>{(staff||[]).filter(s=>s.staffType==="teaching").map((s,i)=><tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{padding:"8px 12px",fontSize:12,fontWeight:"bold"}}>{s.name}</td><td style={{padding:"8px 12px",fontSize:12}}>{s.subject||"—"}</td><td style={{padding:"8px 12px",fontSize:11,color:"#64748b"}}>Teaching</td></tr>)}{!(staff||[]).filter(s=>s.staffType==="teaching").length&&<tr><td colSpan={3} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>Add staff in Staff Manager first.</td></tr>}</tbody></table></Card></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════════════
function AttendancePage({students}) {
  const [cls,setCls]=useState("Grade 7"); const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [att,setAtt]=useState({}); const [saved,setSaved]=useState(false);
  const STATUSES=["Present","Absent","Late","Excused"];
  const SC={Present:"#15803d",Absent:"#b91c1c",Late:"#b45309",Excused:"#7c3aed"};
  const clsStu=students.filter(s=>s.class===cls).sort((a,b)=>a.name.localeCompare(b.name));
  const markAll=(st)=>{const n={...att}; clsStu.forEach(s=>{n[`${date}-${s.id}`]=st;}); setAtt(n);};
  const present=clsStu.filter(s=>!att[`${date}-${s.id}`]||att[`${date}-${s.id}`]==="Present").length;
  const absent=clsStu.filter(s=>att[`${date}-${s.id}`]==="Absent").length;
  const late=clsStu.filter(s=>att[`${date}-${s.id}`]==="Late").length;
  const th={textAlign:"left",padding:"10px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"9px 12px",fontSize:13,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Attendance" sub="Daily class attendance tracking"/>
      <Card style={{marginBottom:16}}><div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}><Sel label="CLASS" value={cls} onChange={setCls} options={ALL_CLASSES}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>DATE</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}/></div><div style={{display:"flex",gap:6}}><Btn onClick={()=>markAll("Present")} v="green" style={{fontSize:11}}>✅ All Present</Btn><Btn onClick={()=>markAll("Absent")} v="red" style={{fontSize:11}}>❌ All Absent</Btn></div></div></Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}><Stat icon="✅" label="Present" value={present} color="#15803d"/><Stat icon="❌" label="Absent" value={absent} color="#b91c1c"/><Stat icon="⏰" label="Late" value={late} color="#b45309"/><Stat icon="👥" label="Total" value={clsStu.length} color="#1d4ed8"/></div>
      {clsStu.length>0?<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["","#","Name","Adm.No","Status"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{clsStu.map((s,i)=>{const st=att[`${date}-${s.id}`]||"Present"; return(<tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,width:44}}><Avatar name={s.name} photo={s.photo} size={30}/></td><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{s.admNo}</td><td style={td}><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{STATUSES.map(x=><button key={x} onClick={()=>setAtt(a=>({...a,[`${date}-${s.id}`]:x}))} style={{padding:"4px 10px",border:"none",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:F,fontWeight:"bold",background:st===x?SC[x]:"#f1f5f9",color:st===x?"white":"#374151"}}>{x}</button>)}</div></td></tr>);})}</tbody></table><div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10}}><Btn onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} v="green">💾 Save Records</Btn>{saved&&<span style={{color:"#15803d",fontWeight:"bold",fontSize:13,alignSelf:"center"}}>✅ Saved!</span>}</div></Card>:<Empty icon="👥" text="No learners in selected class"/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TIME IN/OUT
// ══════════════════════════════════════════════════════════
function TimeInOutPage({students,staff,user}) {
  const [records,setRecords]=useState([]); const [type,setType]=useState("student");
  const [selId,setSelId]=useState(""); const [action,setAction]=useState("In"); const [note,setNote]=useState("");
  const today=new Date().toLocaleDateString("en-KE");
  const todayRec=records.filter(r=>r.date===today);
  const p=n=>String(n).padStart(2,"0");
  function doRec(){if(!selId) return; const now=new Date(); const entity=type==="student"?students.find(s=>s.id===selId):(staff||[]).find(s=>s.id===selId); const time=`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`; setRecords(r=>[...r,{id:Date.now().toString(),type,entityId:selId,name:entity?.name||"—",action,time,date:today,note,recordedBy:user.name}]); setSelId(""); setNote("");}
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Time In / Out" sub="Gate passes, late arrivals and early departures"/>
      <Card style={{marginBottom:18}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Sel label="PERSON TYPE" value={type} onChange={setType} options={["student","staff"]}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>SELECT {type.toUpperCase()}</label><select value={selId} onChange={e=>setSelId(e.target.value)} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select --</option>{(type==="student"?students:(staff||[])).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><Sel label="ACTION" value={action} onChange={setAction} options={["In","Out","Late Arrival","Early Departure","Gate Pass"]}/><Inp label="NOTE (optional)" value={note} onChange={setNote} placeholder="Reason..."/></div><div style={{marginTop:14}}><Btn onClick={doRec} v="teal">🕐 Record Time</Btn></div></Card>
      <Card style={{padding:0,overflow:"hidden"}}><div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>Today's Records — {today} ({todayRec.length})</div><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Time","Name","Type","Action","Note","By"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{todayRec.length?[...todayRec].reverse().map((r,i)=><tr key={r.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,fontFamily:"monospace",fontWeight:"bold",color:"#1d4ed8"}}>{r.time}</td><td style={{...td,fontWeight:"bold"}}>{r.name}</td><td style={td}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:r.type==="student"?"#eff6ff":"#f0fdf4",color:r.type==="student"?"#1d4ed8":"#15803d",fontWeight:"bold"}}>{r.type}</span></td><td style={td}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:(r.action==="In"||r.action==="Late Arrival")?"#f0fdf4":"#fef2f2",color:(r.action==="In"||r.action==="Late Arrival")?"#15803d":"#b91c1c",fontWeight:"bold"}}>{r.action}</span></td><td style={{...td,color:"#64748b"}}>{r.note||"—"}</td><td style={{...td,fontSize:11}}>{r.recordedBy}</td></tr>):<tr><td colSpan={6} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No records today.</td></tr>}</tbody></table></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STAFF MANAGER
// ══════════════════════════════════════════════════════════
function StaffPage({staff,setStaff,users,setUsers}) {
  const blank={name:"",staffId:"",role:"teacher",staffType:"teaching",subject:"",phone:"",email:"",address:"",dob:"",joinDate:new Date().toLocaleDateString("en-KE"),qualification:"",username:"",password:"",photo:""};
  const [form,setForm]=useState(blank); const [editId,setEditId]=useState(null); const [msg,setMsg]=useState({t:"",ok:true});
  const [search,setSearch]=useState(""); const [tab,setTab]=useState("list"); const [filterType,setFilterType]=useState("All");
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),3000);};
  async function doSave(){if(!form.name||!form.staffId) return flash("Name and Staff ID required.",false); const entry={...form,id:editId||Date.now().toString()}; if(editId){setStaff(p=>p.map(s=>s.id===editId?entry:s));}else{if(staff.find(s=>s.staffId===form.staffId)) return flash("Staff ID exists.",false); setStaff(p=>[...p,entry]);} await sbUpsert("staff",entry); if(form.username&&form.password){const ex=users.find(u=>u.username===form.username); const nu={id:"s_"+entry.id,name:form.name,username:form.username,password:form.password,role:form.role==="admin"?"admin":"teacher",email:form.email,staffType:form.staffType,subject:form.subject,phone:form.phone}; if(!ex){setUsers(p=>[...p,nu]);await sbUpsert("users",nu);}} flash(editId?"Staff updated!":"✅ Staff added!"); setForm(blank); setEditId(null); setTab("list");}
  function doEdit(s){setForm({name:s.name,staffId:s.staffId,role:s.role||"teacher",staffType:s.staffType||"teaching",subject:s.subject||"",phone:s.phone||"",email:s.email||"",address:s.address||"",dob:s.dob||"",joinDate:s.joinDate||"",qualification:s.qualification||"",username:s.username||"",password:"",photo:s.photo||""});setEditId(s.id);setTab("add");}
  async function doDel(id){if(confirm("Remove staff member?")){setStaff(p=>p.filter(s=>s.id!==id));await sbDelete("staff",id);}}
  const filtered=(staff||[]).filter(s=>(filterType==="All"||s.staffType===filterType)&&(!search||s.name.toLowerCase().includes(search.toLowerCase())||s.staffId.toLowerCase().includes(search.toLowerCase())));
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Staff Manager" sub="Teaching and non-teaching staff records"><div style={{display:"flex",gap:6}}>{["list","add"].map(t=><Btn key={t} onClick={()=>{setTab(t);if(t==="add"&&!editId)setForm(blank);}} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{t==="list"?"📋 Staff List":"➕ Add Staff"}</Btn>)}</div></PageH>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}><Stat icon="👨‍🏫" label="Teaching" value={(staff||[]).filter(s=>s.staffType==="teaching").length} color="#1d4ed8"/><Stat icon="👷" label="Non-Teaching" value={(staff||[]).filter(s=>s.staffType==="non-teaching").length} color="#b45309"/><Stat icon="👥" label="Total Staff" value={(staff||[]).length} color="#7c3aed"/></div>
      {tab==="add"&&<Card style={{marginBottom:20}}><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>{editId?"Edit Staff Member":"Add New Staff Member"}</div><div style={{marginBottom:14}}><PhotoUp value={form.photo} onChange={v=>setForm({...form,photo:v})}/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Inp label="FULL NAME *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Full name"/><Inp label="STAFF ID *" value={form.staffId} onChange={v=>setForm({...form,staffId:v})} placeholder="NKS/S/001"/><Sel label="STAFF TYPE" value={form.staffType} onChange={v=>setForm({...form,staffType:v})} options={["teaching","non-teaching"]}/><Sel label="SYSTEM ROLE" value={form.role} onChange={v=>setForm({...form,role:v})} options={["teacher","admin"]}/><Inp label="SUBJECT/DEPT *" value={form.subject} onChange={v=>setForm({...form,subject:v})} placeholder="e.g. Mathematics"/><Inp label="PHONE" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+254 7..."/><Inp label="EMAIL" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="email@tnks.sc.ke" type="email"/><Inp label="DATE OF BIRTH" value={form.dob} onChange={v=>setForm({...form,dob:v})} placeholder="DD/MM/YYYY"/><Inp label="DATE JOINED" value={form.joinDate} onChange={v=>setForm({...form,joinDate:v})} placeholder="DD/MM/YYYY"/><Inp label="QUALIFICATION" value={form.qualification} onChange={v=>setForm({...form,qualification:v})} placeholder="e.g. B.Ed"/></div><div style={{marginTop:12,paddingTop:12,borderTop:"1px dashed #e2e8f0"}}><div style={{fontSize:12,fontWeight:"bold",color:"#1e3a5f",marginBottom:10}}>🔐 System Login Credentials</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="USERNAME" value={form.username} onChange={v=>setForm({...form,username:v})} placeholder="e.g. purity"/><Inp label="PASSWORD" value={form.password} onChange={v=>setForm({...form,password:v})} placeholder="Set password" type="password"/></div></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={doSave} v="primary">{editId?"Update Staff":"Add Staff"}</Btn>{editId&&<Btn onClick={()=>{setEditId(null);setForm(blank);setTab("list");}} v="ghost">Cancel</Btn>}</div></Card>}
      {tab==="list"&&<><div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff..." style={{flex:1,minWidth:200,border:"1.5px solid #e2e8f0",borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:F,outline:"none"}}/><Sel value={filterType} onChange={setFilterType} options={["All","teaching","non-teaching"]}/></div><Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["","#","Staff ID","Name","Type","Subject","Phone","Qual","Actions"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{filtered.length?filtered.map((s,i)=><tr key={s.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,width:44}}><Avatar name={s.name} photo={s.photo} size={32}/></td><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{s.staffId}</td><td style={{...td,fontWeight:"bold"}}>{s.name}</td><td style={td}><span style={{background:s.staffType==="teaching"?"#eff6ff":"#f0fdf4",color:s.staffType==="teaching"?"#1d4ed8":"#15803d",fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{s.staffType}</span></td><td style={td}>{s.subject||"—"}</td><td style={td}>{s.phone||"—"}</td><td style={{...td,fontSize:11}}>{s.qualification||"—"}</td><td style={td}><button onClick={()=>doEdit(s)} style={{color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",fontSize:12,marginRight:8}}>Edit</button><button onClick={()=>doDel(s.id)} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:12}}>Del</button></td></tr>):<tr><td colSpan={9} style={{padding:40,textAlign:"center",color:"#94a3b8"}}>No staff records.</td></tr>}</tbody></table></Card></>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TEACHERS ON DUTY
// ══════════════════════════════════════════════════════════
function DutyPage({staff,user}) {
  const [duties,setDuties]=useState([]); const [tab,setTab]=useState("today");
  const [form,setForm]=useState({teacherId:"",day:"Monday",dutyType:"Morning Duty",startTime:"06:30",endTime:"07:30",term:"Term 1",note:""});
  const [msg,setMsg]=useState({t:"",ok:true});
  useEffect(()=>{(async()=>{const d=await sbGet("duties");if(d&&d.length)setDuties(d);})();;},[]);
  
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  async function doAdd(){if(!form.teacherId) return flash("Select a teacher.",false); const t=(staff||[]).find(s=>s.id===form.teacherId); const entry={...form,id:Date.now().toString(),teacherName:t?.name||"—",addedBy:user.name}; setDuties(p=>[...p,entry]); await sbUpsert("duties",entry); flash("✅ Duty assigned!"); setForm({...form,teacherId:"",note:""});}
  const today=DAYS[new Date().getDay()-1]||"Monday";
  const todayD=duties.filter(d=>d.day===today);
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="🛡️ Teachers on Duty" sub="Weekly duty roster and assignments"/>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["today","📅 Today"],["roster","📋 Weekly Roster"],["term","🗓️ Term View"],user?.role==="admin"&&["assign","➕ Assign"]].filter(Boolean).map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}
      </div>
      {tab==="today"&&<><div style={{background:"linear-gradient(135deg,#1e3a5f,#15803d)",borderRadius:14,padding:"16px 20px",marginBottom:16,color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:"bold"}}>Today: {today}</div><div style={{fontSize:12,opacity:.8}}>{new Date().toLocaleDateString("en-KE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div><div style={{fontSize:36}}>🛡️</div></div>{todayD.length?<div style={{display:"grid",gap:10}}>{todayD.map(d=><Card key={d.id} style={{borderLeft:"4px solid #1d4ed8",padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:14}}>{d.teacherName}</div><div style={{fontSize:12,color:"#64748b",marginTop:3}}>{d.dutyType} · {d.startTime} – {d.endTime}</div>{d.note&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{d.note}</div>}</div><span style={{background:"#eff6ff",color:"#1d4ed8",fontSize:11,padding:"4px 12px",borderRadius:20,fontWeight:"bold",alignSelf:"flex-start"}}>{d.dutyType}</span></div></Card>)}</div>:<Empty icon="🛡️" text="No duties assigned for today"/>}</>}
      {tab==="roster"&&<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}><thead><tr style={{background:"#1e3a5f"}}>{["Duty Type",...DAYS].map(h=><th key={h} style={{padding:"10px 12px",color:"white",fontSize:12,textAlign:"left"}}>{h}</th>)}</tr></thead><tbody>{DUTY_TYPES.map((dt,i)=><tr key={dt} style={{background:i%2===0?"white":"#fafafa"}}><td style={{padding:"10px 12px",fontWeight:"bold",fontSize:12,color:"#1e3a5f",borderRight:"2px solid #eff6ff"}}>{dt}</td>{DAYS.map(day=>{const d=duties.filter(x=>x.day===day&&x.dutyType===dt); return(<td key={day} style={{padding:"8px 12px",verticalAlign:"top"}}>{d.length?d.map(x=><div key={x.id} style={{background:"#eff6ff",borderRadius:6,padding:"4px 8px",marginBottom:4,fontSize:11}}><div style={{fontWeight:"bold",color:"#1d4ed8"}}>{x.teacherName}</div><div style={{color:"#64748b"}}>{x.startTime}–{x.endTime}</div>{user?.role==="admin"&&<button onClick={()=>{setDuties(p=>p.filter(y=>y.id!==x.id));sbDelete("duties",x.id);}} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:10,padding:0}}>✕ Remove</button>}</div>):<span style={{fontSize:11,color:"#cbd5e1"}}>—</span>}</td>);})}</tr>)}</tbody></table></div>}
      {tab==="term"&&<div>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <Sel value={form.term} onChange={v=>setForm({...form,term:v})} options={TERMS} label="FILTER BY TERM"/>
        </div>
        {DUTY_TYPES.map(dt=>{const termDuties=duties.filter(d=>d.dutyType===dt&&d.term===form.term); if(!termDuties.length) return null; return(
          <Card key={dt} style={{marginBottom:12,padding:"14px 18px"}}>
            <div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:13,marginBottom:10,borderBottom:"1px solid #eff6ff",paddingBottom:6}}>🛡️ {dt}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
              {DAYS.map(day=>{const dd=termDuties.filter(d=>d.day===day); return dd.length?(<div key={day} style={{background:"#eff6ff",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,fontWeight:"bold",color:"#1d4ed8",marginBottom:4}}>{day}</div>{dd.map(d=><div key={d.id} style={{fontSize:12,marginBottom:2}}><span style={{fontWeight:"bold"}}>{d.teacherName}</span><span style={{color:"#64748b",fontSize:11}}> · {d.startTime}–{d.endTime}</span>{user?.role==="admin"&&<button onClick={()=>setDuties(p=>p.filter(y=>y.id!==d.id))} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:10,marginLeft:4}}>✕</button>}</div>)}</div>):null;})}
            </div>
          </Card>
        );})}
        {!duties.filter(d=>d.term===form.term).length&&<Empty icon="🛡️" text="No duties assigned for this term yet."/>}
      </div>}
      {tab==="assign"&&user?.role==="admin"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>Assign Duty to Teacher</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:12,background:"#eff6ff",borderRadius:8,padding:"10px 14px"}}>Duties assigned here repeat <b>every week</b> for the selected term. To assign a one-off duty, set a specific date in the note field.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>TEACHER *</label><select value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select teacher --</option>{(staff||[]).filter(s=>s.staffType==="teaching").map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><Sel label="DAY" value={form.day} onChange={v=>setForm({...form,day:v})} options={DAYS}/><Sel label="DUTY TYPE" value={form.dutyType} onChange={v=>setForm({...form,dutyType:v})} options={DUTY_TYPES}/><Sel label="TERM" value={form.term} onChange={v=>setForm({...form,term:v})} options={TERMS}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>START TIME</label><input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}/></div><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>END TIME</label><input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}/></div><Inp label="NOTE (optional)" value={form.note} onChange={v=>setForm({...form,note:v})} placeholder="Any notes..."/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doAdd} v="primary">➕ Assign Duty</Btn></div></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STUDENT COUNCIL & DUTIES
// ══════════════════════════════════════════════════════════
function CouncilPage({students,user}) {
  const [council,setCouncil]=useState([]); const [stuDuties,setStuDuties]=useState([]); const [tab,setTab]=useState("council");
  const [cForm,setCForm]=useState({studentId:"",position:"Head Boy",term:"Term 1",year:String(new Date().getFullYear())});
  const [dForm,setDForm]=useState({studentId:"",dutyType:"Dining Hall",day:"Monday",term:"Term 1"});
  const [msg,setMsg]=useState({t:"",ok:true});
  useEffect(()=>{(async()=>{const d=await sbGet("council");if(d&&d.length)setCouncil(d); const d2=await sbGet("studuties");if(d2&&d2.length)setStuDuties(d2);})();},[]);
  
  
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  async function addCouncil(){if(!cForm.studentId) return flash("Select a student.",false); if(council.find(c=>c.position===cForm.position&&c.term===cForm.term&&c.year===cForm.year)) return flash("Position already filled for this term.",false); const s=students.find(x=>x.id===cForm.studentId); const entry={...cForm,id:Date.now().toString(),studentName:s?.name||"—",studentClass:s?.class||"—"}; setCouncil(p=>[...p,entry]); await sbUpsert("council",entry); flash("✅ Council member added!"); setCForm({...cForm,studentId:""});}
  async function addDuty(){if(!dForm.studentId) return flash("Select a student.",false); const s=students.find(x=>x.id===dForm.studentId); const entry={...dForm,id:Date.now().toString(),studentName:s?.name||"—",studentClass:s?.class||"—"}; setStuDuties(p=>[...p,entry]); await sbUpsert("studuties",entry); flash("✅ Duty assigned!"); setDForm({...dForm,studentId:""});}
  const today=DAYS[new Date().getDay()-1]||"Monday";
  const todayD=stuDuties.filter(d=>d.day===today);
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  const tabs=[["council","🎖️ Council Members"],["dutyboard","📋 Duty Roster"],["termduty","🗓️ Term Roster"],["todayduty","📅 Today's Duty"],user?.role==="admin"&&["addcouncil","➕ Add Council"],user?.role==="admin"&&["addduty","➕ Assign Duty"]].filter(Boolean);
  return (
    <div style={{padding:24}}>
      <PageH title="🎖️ Student Council & Duties" sub="Leadership, prefects and duty assignments"/>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{tabs.map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:11}}>{l}</Btn>)}</div>
      {tab==="council"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Student","Class","Position","Term","Year",user?.role==="admin"?"Action":""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{council.length?council.map((c,i)=><tr key={c.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{c.studentName}</td><td style={td}>{c.studentClass}</td><td style={td}><span style={{background:"linear-gradient(135deg,#1e3a5f,#15803d)",color:"white",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:"bold"}}>{c.position}</span></td><td style={td}>{c.term}</td><td style={td}>{c.year}</td>{user?.role==="admin"&&<td style={td}><button onClick={()=>{setCouncil(p=>p.filter(x=>x.id!==c.id));sbDelete("council",c.id);}} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:12}}>Remove</button></td>}</tr>):<tr><td colSpan={7} style={{padding:40,textAlign:"center",color:"#94a3b8"}}>No council members yet.</td></tr>}</tbody></table></Card>}
      {tab==="dutyboard"&&<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}><thead><tr style={{background:"#1e3a5f"}}>{["Duty Type",...DAYS].map(h=><th key={h} style={{padding:"10px 12px",color:"white",fontSize:12,textAlign:"left"}}>{h}</th>)}</tr></thead><tbody>{STUDENT_DUTIES.map((dt,i)=><tr key={dt} style={{background:i%2===0?"white":"#fafafa"}}><td style={{padding:"10px 12px",fontWeight:"bold",fontSize:12,color:"#1e3a5f",borderRight:"2px solid #eff6ff"}}>{dt}</td>{DAYS.map(day=>{const d=stuDuties.filter(x=>x.day===day&&x.dutyType===dt); return(<td key={day} style={{padding:"8px 12px",verticalAlign:"top"}}>{d.length?d.map(x=><div key={x.id} style={{background:"#f0fdf4",borderRadius:6,padding:"4px 8px",marginBottom:4,fontSize:11}}><div style={{fontWeight:"bold",color:"#15803d"}}>{x.studentName}</div><div style={{color:"#64748b"}}>{x.studentClass}</div>{user?.role==="admin"&&<button onClick={()=>{setStuDuties(p=>p.filter(y=>y.id!==x.id));sbDelete("studuties",x.id);}} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:10,padding:0}}>✕</button>}</div>):<span style={{fontSize:11,color:"#cbd5e1"}}>—</span>}</td>);})}</tr>)}</tbody></table></div>}
      {tab==="todayduty"&&<><div style={{background:"linear-gradient(135deg,#15803d,#065f46)",borderRadius:14,padding:"16px 20px",marginBottom:16,color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:"bold"}}>Today: {today}</div><div style={{fontSize:12,opacity:.8}}>{new Date().toLocaleDateString("en-KE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div><div style={{fontSize:36}}>🎖️</div></div>{todayD.length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>{todayD.map(d=><Card key={d.id} style={{borderLeft:"4px solid #15803d",padding:"12px 16px"}}><div style={{fontWeight:"bold",color:"#1e3a5f"}}>{d.studentName}</div><div style={{fontSize:12,color:"#64748b"}}>{d.studentClass}</div><span style={{fontSize:11,background:"#f0fdf4",color:"#15803d",padding:"2px 10px",borderRadius:20,fontWeight:"bold"}}>{d.dutyType}</span></Card>)}</div>:<Empty icon="🎖️" text="No student duties for today"/>}</>}
      {tab==="termduty"&&<div>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <Sel value={dForm.term} onChange={v=>setDForm({...dForm,term:v})} options={TERMS} label="FILTER BY TERM"/>
        </div>
        {STUDENT_DUTIES.map(dt=>{const termDuties=stuDuties.filter(d=>d.dutyType===dt&&d.term===dForm.term); if(!termDuties.length) return null; return(
          <Card key={dt} style={{marginBottom:12,padding:"14px 18px"}}>
            <div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:13,marginBottom:10,borderBottom:"1px solid #f0fdf4",paddingBottom:6}}>🎖️ {dt}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {DAYS.map(day=>{const dd=termDuties.filter(d=>d.day===day); return dd.length?(<div key={day} style={{background:"#f0fdf4",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,fontWeight:"bold",color:"#15803d",marginBottom:4}}>{day}</div>{dd.map(d=><div key={d.id} style={{fontSize:12,marginBottom:2}}><span style={{fontWeight:"bold"}}>{d.studentName}</span><span style={{color:"#64748b",fontSize:11}}> · {d.studentClass}</span>{user?.role==="admin"&&<button onClick={()=>{setStuDuties(p=>p.filter(y=>y.id!==d.id));sbDelete("studuties",d.id);}} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:10,marginLeft:4}}>✕</button>}</div>)}</div>):null;})}
            </div>
          </Card>
        );})}
        {!stuDuties.filter(d=>d.term===dForm.term).length&&<Empty icon="🎖️" text="No student duties assigned for this term yet."/>}
      </div>}
      {tab==="addcouncil"&&user?.role==="admin"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>Add Council Member / Prefect</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>STUDENT *</label><select value={cForm.studentId} onChange={e=>setCForm({...cForm,studentId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select student --</option>{students.filter(s=>["Grade 7","Grade 8","Grade 9"].includes(s.class)).map(s=><option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select></div><Sel label="POSITION" value={cForm.position} onChange={v=>setCForm({...cForm,position:v})} options={COUNCIL_POSITIONS}/><Sel label="TERM" value={cForm.term} onChange={v=>setCForm({...cForm,term:v})} options={TERMS}/><Sel label="YEAR" value={cForm.year} onChange={v=>setCForm({...cForm,year:v})} options={YEARS}/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={addCouncil} v="primary">🎖️ Add to Council</Btn></div></Card>}
      {tab==="addduty"&&user?.role==="admin"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>Assign Duty to Student</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:12,background:"#f0fdf4",borderRadius:8,padding:"10px 14px"}}>Student duties assigned here repeat <b>every week</b> for the selected term. The duty board shows the full term roster.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>STUDENT *</label><select value={dForm.studentId} onChange={e=>setDForm({...dForm,studentId:e.target.value})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select student --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select></div><Sel label="DUTY TYPE" value={dForm.dutyType} onChange={v=>setDForm({...dForm,dutyType:v})} options={STUDENT_DUTIES}/><Sel label="DAY" value={dForm.day} onChange={v=>setDForm({...dForm,day:v})} options={DAYS}/><Sel label="TERM" value={dForm.term} onChange={v=>setDForm({...dForm,term:v})} options={TERMS}/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={addDuty} v="green">➕ Assign Duty</Btn></div></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// LIBRARY
// ══════════════════════════════════════════════════════════
function LibraryPage() {
  const [books,setBooks]=useState([]); const [borrows,setBorrows]=useState([]); const [tab,setTab]=useState("catalogue");
  const blank={title:"",author:"",isbn:"",category:"Textbook",copies:1,available:1};
  const [form,setForm]=useState(blank); const [msg,setMsg]=useState({t:"",ok:true});
  const [bbId,setBbId]=useState(""); const [bStu,setBStu]=useState(""); const [bDue,setBDue]=useState("");
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  function doAdd(){if(!form.title) return flash("Title required.",false); setBooks(p=>[...p,{...form,id:Date.now().toString(),copies:parseInt(form.copies)||1,available:parseInt(form.copies)||1}]); flash("✅ Book added!"); setForm(blank);}
  function doBorrow(){if(!bbId||!bStu) return flash("Select book and enter student ID.",false); const b=books.find(x=>x.id===bbId); if(!b||b.available<1) return flash("Book not available.",false); setBooks(p=>p.map(x=>x.id===bbId?{...x,available:x.available-1}:x)); setBorrows(p=>[...p,{id:Date.now().toString(),bookId:bbId,bookTitle:b.title,studentId:bStu,issueDate:new Date().toLocaleDateString("en-KE"),dueDate:bDue,status:"issued"}]); flash("✅ Book issued!"); setBbId("");setBStu("");setBDue("");}
  function retBook(id){const b=borrows.find(x=>x.id===id); if(b){setBorrows(p=>p.map(x=>x.id===id?{...x,status:"returned"}:x)); setBooks(p=>p.map(bk=>bk.id===b.bookId?{...bk,available:bk.available+1}:bk));}}
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="Library" sub="Book catalogue, issuing and returns"><div style={{display:"flex",gap:6}}>{[["catalogue","📚 Catalogue"],["add","➕ Add Book"],["issue","📤 Issue"],["issued","📋 Issued"]].map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:11}}>{l}</Btn>)}</div></PageH>
      {tab==="add"&&<Card style={{marginBottom:18}}><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14}}>Add New Book</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Inp label="TITLE *" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Book title"/><Inp label="AUTHOR" value={form.author} onChange={v=>setForm({...form,author:v})} placeholder="Author name"/><Inp label="ISBN" value={form.isbn} onChange={v=>setForm({...form,isbn:v})} placeholder="ISBN number"/><Sel label="CATEGORY" value={form.category} onChange={v=>setForm({...form,category:v})} options={["Reference","Novel","Textbook","Science","History","Religious","Arts","Biography","Other"]}/><Inp label="COPIES" value={form.copies} onChange={v=>setForm({...form,copies:v})} placeholder="1" type="number"/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doAdd} v="green">➕ Add Book</Btn></div></Card>}
      {tab==="catalogue"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Title","Author","ISBN","Category","Copies","Available"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{books.length?books.map((b,i)=><tr key={b.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{b.title}</td><td style={td}>{b.author||"—"}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{b.isbn||"—"}</td><td style={td}>{b.category}</td><td style={td}>{b.copies}</td><td style={td}><span style={{fontWeight:"bold",color:b.available>0?"#15803d":"#b91c1c"}}>{b.available}</span></td></tr>):<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No books added yet.</td></tr>}</tbody></table></Card>}
      {tab==="issue"&&<Card><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14}}>Issue Book to Student</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:3}}>SELECT BOOK</label><select value={bbId} onChange={e=>setBbId(e.target.value)} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px",fontSize:13,fontFamily:F}}><option value="">-- Select book --</option>{books.filter(b=>b.available>0).map(b=><option key={b.id} value={b.id}>{b.title} — {b.author} (Avail: {b.available})</option>)}</select></div><Inp label="STUDENT ID (Adm. No)" value={bStu} onChange={setBStu} placeholder="e.g. NKS/001"/><Inp label="DUE DATE" value={bDue} onChange={setBDue} type="date"/></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doBorrow} v="green">📤 Issue Book</Btn></div></Card>}
      {tab==="issued"&&<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["#","Book","Student","Issued","Due","Status","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{borrows.length?borrows.map((b,i)=><tr key={b.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,color:"#94a3b8"}}>{i+1}</td><td style={{...td,fontWeight:"bold"}}>{b.bookTitle}</td><td style={td}>{b.studentId}</td><td style={td}>{b.issueDate}</td><td style={td}>{b.dueDate||"—"}</td><td style={td}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:b.status==="returned"?"#f0fdf4":"#fef3c7",color:b.status==="returned"?"#15803d":"#b45309"}}>{b.status}</span></td><td style={td}>{b.status==="issued"&&<button onClick={()=>retBook(b.id)} style={{background:"#15803d",color:"white",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:F}}>Return</button>}</td></tr>):<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No books issued.</td></tr>}</tbody></table></Card>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════
function EventsPage({user}) {
  const [events,setEvents]=useState([]); const blank={title:"",date:"",time:"",venue:"",description:"",type:"Academic",audience:"All"};
  const [form,setForm]=useState(blank); const [msg,setMsg]=useState({t:"",ok:true}); const [tab,setTab]=useState("calendar");
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  function doSave(){if(!form.title||!form.date) return flash("Title and date required.",false); setEvents(p=>[...p,{...form,id:Date.now().toString(),addedBy:user.name}]); setForm(blank); flash("✅ Event added!");}
  const upcoming=events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past=events.filter(e=>new Date(e.date)<new Date());
  const tC={Academic:"#1d4ed8",Sports:"#15803d",Cultural:"#b45309",Meeting:"#7c3aed",Holiday:"#0e7490",Other:"#64748b"};
  return (
    <div style={{padding:24}}>
      <PageH title="Events & Calendar" sub="School events, meetings and activities"/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[["calendar","📅 Upcoming"],["past","📜 Past"],user.role==="admin"&&["add","➕ Add"]].filter(Boolean).map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}</div>
      {tab==="add"&&user.role==="admin"&&<Card style={{marginBottom:18}}><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14}}>Add New Event</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}><Inp label="EVENT TITLE *" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Event name"/><Inp label="DATE *" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/><Inp label="TIME" value={form.time} onChange={v=>setForm({...form,time:v})} placeholder="9:00 AM"/><Inp label="VENUE" value={form.venue} onChange={v=>setForm({...form,venue:v})} placeholder="Location"/><Sel label="TYPE" value={form.type} onChange={v=>setForm({...form,type:v})} options={["Academic","Sports","Cultural","Meeting","Holiday","Other"]}/><Sel label="AUDIENCE" value={form.audience} onChange={v=>setForm({...form,audience:v})} options={["All","Students","Staff","Parents","Specific Class"]}/></div><Textarea label="DESCRIPTION" value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="Details..." rows={3}/>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doSave} v="primary">Add Event</Btn></div></Card>}
      {(tab==="calendar"||tab==="past")&&((tab==="calendar"?upcoming:past).length?<div style={{display:"grid",gap:12}}>{(tab==="calendar"?upcoming:past).map(e=><Card key={e.id} style={{borderLeft:`4px solid ${tC[e.type]||"#64748b"}`,padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:14}}>{e.title}</div><div style={{fontSize:12,color:"#64748b",marginTop:3}}>📅 {e.date} {e.time&&`at ${e.time}`} {e.venue&&`• 📍 ${e.venue}`}</div>{e.description&&<div style={{fontSize:12,color:"#374151",marginTop:5}}>{e.description}</div>}<div style={{marginTop:6,display:"flex",gap:6}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#eff6ff",color:tC[e.type]||"#64748b"}}>{e.type}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#f0fdf4",color:"#15803d"}}>{e.audience}</span></div></div>{user.role==="admin"&&<button onClick={()=>setEvents(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:16}}>🗑️</button>}</div></Card>)}</div>:<Empty icon="📅" text={tab==="calendar"?"No upcoming events.":"No past events."}/>)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// NOTICE BOARD (with document upload)
// ══════════════════════════════════════════════════════════
function NoticeBoard({announcements,setAnnouncements,user}) {
  const blank={title:"",body:"",category:"General",priority:"Normal",date:new Date().toLocaleDateString("en-KE"),author:user.name,attachment:null,attachName:"",attachType:""};
  const [form,setForm]=useState(blank); const [msg,setMsg]=useState({t:"",ok:true});
  const [search,setSearch]=useState(""); const [filterCat,setFilterCat]=useState("All"); const [tab,setTab]=useState("view");
  const [viewAtt,setViewAtt]=useState(null);
  const fileRef=useRef();
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  function doSave(){if(!form.title||!form.body) return flash("Title and message required.",false); setAnnouncements(p=>[...(p||[]),{...form,id:Date.now().toString()}]); setForm(blank); flash("✅ Notice posted!"); setTab("view");}
  function doDel(id){setAnnouncements(p=>p.filter(a=>a.id!==id));}
  function handleFile(e){const f=e.target.files[0]; if(!f) return; if(f.size>5*1024*1024){flash("File too large (max 5MB).",false);return;} const r=new FileReader(); r.onload=ev=>setForm(fm=>({...fm,attachment:ev.target.result,attachName:f.name,attachType:f.type})); r.readAsDataURL(f);}
  const catC={General:"#1d4ed8",Academic:"#15803d",Fees:"#b91c1c",Events:"#b45309",Health:"#7c3aed",Urgent:"#dc2626"};
  const filtered=(announcements||[]).filter(a=>(filterCat==="All"||a.category===filterCat)&&(!search||a.title.toLowerCase().includes(search.toLowerCase()))).reverse();
  return (
    <div style={{padding:24}}>
      <PageH title="📌 Notice Board" sub="School announcements, notices and document uploads"/>
      <div style={{display:"flex",gap:8,marginBottom:16}}><Btn onClick={()=>setTab("view")} v={tab==="view"?"primary":"ghost"} style={{fontSize:12}}>📌 Notices</Btn>{user.role==="admin"&&<Btn onClick={()=>setTab("add")} v={tab==="add"?"primary":"ghost"} style={{fontSize:12}}>➕ Post Notice</Btn>}</div>
      {tab==="add"&&user.role==="admin"&&<Card style={{marginBottom:18}}><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>Post Notice / Upload Document</div><div style={{display:"grid",gap:12}}><Inp label="TITLE *" value={form.title} onChange={v=>setForm({...form,title:v})} placeholder="Notice title"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Sel label="CATEGORY" value={form.category} onChange={v=>setForm({...form,category:v})} options={["General","Academic","Fees","Events","Health","Urgent"]}/><Sel label="PRIORITY" value={form.priority} onChange={v=>setForm({...form,priority:v})} options={["Normal","High","Urgent"]}/></div><Textarea label="MESSAGE *" value={form.body} onChange={v=>setForm({...form,body:v})} placeholder="Notice content..." rows={4}/><div><label style={{fontSize:11,fontWeight:"bold",color:"#374151",display:"block",marginBottom:6}}>📎 ATTACH DOCUMENT (PDF, Image, Word — max 5MB)</label><div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={()=>fileRef.current?.click()} style={{background:"#eff6ff",border:"1.5px dashed #93c5fd",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:12,color:"#1d4ed8",fontFamily:F,fontWeight:"bold"}}>📁 Choose File</button>{form.attachName&&<><span style={{fontSize:12,color:"#15803d",fontWeight:"bold"}}>✅ {form.attachName}</span><button onClick={()=>setForm({...form,attachment:null,attachName:"",attachType:""})} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:12}}>✕</button></>}</div><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" style={{display:"none"}} onChange={handleFile}/><div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Accepted: PDF, Word, JPG, PNG, GIF</div></div></div>{msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}<div style={{marginTop:14}}><Btn onClick={doSave} v="primary">📌 Post Notice</Btn></div></Card>}
      {viewAtt&&<Modal title={`📎 ${viewAtt.name}`} onClose={()=>setViewAtt(null)} wide>{viewAtt.type?.startsWith("image/")?<img src={viewAtt.data} alt={viewAtt.name} style={{width:"100%",borderRadius:8}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:60,marginBottom:12}}>{viewAtt.type==="application/pdf"?"📄":"📁"}</div><div style={{fontSize:14,fontWeight:"bold",marginBottom:12}}>{viewAtt.name}</div><a href={viewAtt.data} download={viewAtt.name} style={{background:"#1d4ed8",color:"white",padding:"10px 24px",borderRadius:9,textDecoration:"none",fontSize:13,fontFamily:F,fontWeight:"bold"}}>⬇️ Download</a></div>}</Modal>}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notices..." style={{flex:1,minWidth:160,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F,outline:"none"}}/><Sel value={filterCat} onChange={setFilterCat} options={["All","General","Academic","Fees","Events","Health","Urgent"]}/></div>
      <div style={{display:"grid",gap:12}}>
        {filtered.length?filtered.map(a=><Card key={a.id} style={{borderLeft:`4px solid ${catC[a.category]||"#64748b"}`,padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{display:"flex",gap:8,marginBottom:5,flexWrap:"wrap"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#eff6ff",color:catC[a.category]||"#1d4ed8"}}>{a.category}</span>{a.priority==="Urgent"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#fee2e2",color:"#b91c1c"}}>🔴 URGENT</span>}{a.priority==="High"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#fef3c7",color:"#b45309"}}>⚡ HIGH</span>}{a.attachName&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold",background:"#f0fdf4",color:"#15803d"}}>📎 {a.attachName}</span>}</div><div style={{fontWeight:"bold",color:"#1e3a5f",fontSize:14,marginBottom:6}}>{a.title}</div><div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{a.body}</div>{a.attachName&&<button onClick={()=>setViewAtt({data:a.attachment,name:a.attachName,type:a.attachType})} style={{marginTop:10,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,color:"#1d4ed8",fontFamily:F,fontWeight:"bold"}}>📎 View / Download: {a.attachName}</button>}<div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Posted by {a.author} · {a.date}</div></div>{user.role==="admin"&&<button onClick={()=>doDel(a.id)} style={{background:"none",border:"none",color:"#b91c1c",cursor:"pointer",fontSize:16,marginLeft:12}}>🗑️</button>}</div></Card>):<Empty icon="📌" text="No notices yet."/>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SETTINGS (with logo editor, no share link)
// ══════════════════════════════════════════════════════════
function SettingsPage({users,setUsers,logo,setLogo}) {
  const blank={name:"",username:"",email:"",phone:"",password:"",role:"teacher",staffType:"teaching",subject:""};
  const [form,setForm]=useState(blank); const [msg,setMsg]=useState({t:"",ok:true});
  const [resetTarget,setResetTarget]=useState(null); const [nPw,setNPw]=useState(""); const [rMsg,setRMsg]=useState("");
  const [logoMsg,setLogoMsg]=useState("");
  const logoRef=useRef();
  const flash=(t,ok=true)=>{setMsg({t,ok});setTimeout(()=>setMsg({t:"",ok:true}),2500);};
  function doAdd(){if(!form.name||!form.username||!form.password) return flash("Name, username and password required.",false); if(users.find(u=>u.username===form.username)) return flash("Username already exists.",false); setUsers(p=>[...p,{...form,id:Date.now().toString()}]); flash("✅ Account created!"); setForm(blank);}
  function doDel(id){if(confirm("Delete this account?")) setUsers(p=>p.filter(u=>u.id!==id));}
  function doReset(){if(nPw.length<6){setRMsg("Min 6 chars.");return;} setUsers(p=>p.map(u=>u.id===resetTarget.id?{...u,password:nPw}:u)); setRMsg("✅ Password reset!"); setTimeout(()=>{setResetTarget(null);setNPw("");setRMsg("");},1500);}
  function handleLogo(e){const f=e.target.files[0]; if(!f) return; if(!f.type.startsWith("image/")){setLogoMsg("Please select an image file.");return;} const r=new FileReader(); r.onload=ev=>{setLogo(ev.target.result); saveSetting("logo",ev.target.result); setLogoMsg("✅ Logo updated!"); setTimeout(()=>setLogoMsg(""),3000);}; r.readAsDataURL(f);}
  function removeLogo(){setLogo(null); saveSetting("logo",null); setLogoMsg("Custom logo removed. Using embedded school logo."); setTimeout(()=>setLogoMsg(""),3000);}
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <PageH title="⚙️ Settings" sub="Logo editor, staff accounts and school configuration"/>
      {resetTarget&&<Modal title={`🔑 Reset Password — ${resetTarget.name}`} onClose={()=>{setResetTarget(null);setNPw("");setRMsg("");}}><Inp label="NEW PASSWORD" value={nPw} onChange={setNPw} placeholder="Min 6 characters" type="password"/>{rMsg&&<div style={{marginTop:8,fontSize:13,color:rMsg.startsWith("✅")?"#15803d":"#b91c1c",fontWeight:"bold"}}>{rMsg}</div>}<div style={{display:"flex",gap:8,marginTop:14}}><Btn onClick={doReset} v="primary">Set Password</Btn><Btn onClick={()=>{setResetTarget(null);setNPw("");setRMsg("");}} v="ghost">Cancel</Btn></div></Modal>}

      {/* LOGO EDITOR */}
      <Card style={{marginBottom:18,borderLeft:"4px solid #1d4ed8"}}>
        <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:14,fontSize:14}}>🖼️ School Logo</div>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{textAlign:"center"}}><Logo size={80} src={logo}/><div style={{fontSize:11,color:"#64748b",marginTop:6}}>Current Logo</div></div>
          <div><div style={{fontSize:13,color:"#374151",marginBottom:10}}>Upload your school logo (JPG, PNG, GIF). It will appear on all pages, sidebar, dashboards and printed report cards.</div><div style={{display:"flex",gap:8}}><Btn onClick={()=>logoRef.current?.click()} v="primary" style={{fontSize:12}}>📁 Upload New Logo</Btn>{logo&&<Btn onClick={removeLogo} v="red" style={{fontSize:12}}>🗑️ Remove Logo</Btn>}</div>{logoMsg&&<div style={{marginTop:8,fontSize:13,color:logoMsg.startsWith("✅")?"#15803d":"#b91c1c",fontWeight:"bold"}}>{logoMsg}</div>}<input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/></div>
        </div>
      </Card>

      {/* SCHOOL INFO */}
      <Card style={{marginBottom:18,background:"#eff6ff",border:"1px solid #bfdbfe"}}>
        <div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:10,fontSize:13}}>🏫 School Information</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8,fontSize:12,color:"#374151"}}>
          {[["Name",SCHOOL.name],["Location",SCHOOL.location],["Phone",SCHOOL.phone],["Email",SCHOOL.email],["Website",SCHOOL.website],["Founded",SCHOOL.founded],["Motto",SCHOOL.motto]].map(([k,v])=><div key={k}><b>{k}:</b> {k==="Motto"?<i style={{color:"#15803d"}}>"{v}"</i>:v}</div>)}
        </div>
      </Card>

      {/* ACCESS INFO */}
      <Card style={{marginBottom:18,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
        <div style={{fontWeight:"bold",color:"#15803d",marginBottom:10,fontSize:13}}>🔗 How Staff & Parents Access the System</div>
        <div style={{fontSize:12,color:"#374151",lineHeight:1.8}}>
          <p style={{margin:"0 0 6px"}}>All users access the same URL. Share the link with staff and parents.</p>
          <p style={{margin:"0 0 6px"}}>• <b>Staff/Admin:</b> Created in the table below. They use their username &amp; password.</p>
          <p style={{margin:0}}>• <b>Parents:</b> Set the learner's email and parent password in the Student record. Parents login via the "Parent" tab.</p>
        </div>
        <button onClick={()=>navigator.clipboard.writeText(window.location.href.split("?")[0]).then(()=>alert("URL copied!"))} style={{marginTop:10,background:"#15803d",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:F,fontWeight:"bold"}}>📋 Copy System URL</button>
      </Card>

      {/* ADD ACCOUNT */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:18,alignItems:"start"}}>
        <Card>
          <div style={{fontWeight:"bold",color:"#1e293b",marginBottom:14,fontSize:13}}>Add New Staff Account</div>
          <div style={{display:"grid",gap:10}}>
            <Inp label="FULL NAME *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Ms. Purity"/>
            <Inp label="USERNAME *" value={form.username} onChange={v=>setForm({...form,username:v})} placeholder="e.g. purity"/>
            <Inp label="EMAIL" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="purity@tnks.sc.ke" type="email"/>
            <Inp label="PHONE" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+254 7..."/>
            <Inp label="PASSWORD *" value={form.password} onChange={v=>setForm({...form,password:v})} placeholder="Set a password" type="password"/>
            <Sel label="ROLE" value={form.role} onChange={v=>setForm({...form,role:v})} options={["teacher","admin"]}/>
            <Sel label="STAFF TYPE" value={form.staffType} onChange={v=>setForm({...form,staffType:v})} options={["teaching","non-teaching"]}/>
            <Inp label="SUBJECT/DEPT" value={form.subject} onChange={v=>setForm({...form,subject:v})} placeholder="e.g. Mathematics"/>
          </div>
          {msg.t&&<div style={{marginTop:10,fontSize:13,color:msg.ok?"#15803d":"#b91c1c",fontWeight:"bold"}}>{msg.t}</div>}
          <div style={{marginTop:14}}><Btn onClick={doAdd} v="primary">Add Account</Btn></div>
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>Staff Accounts ({users.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Name","Username","Role","Type","Actions"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{users.map((u,i)=><tr key={u.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td,fontWeight:"bold"}}>{u.name}</td><td style={{...td,fontFamily:"monospace",fontSize:11}}>{u.username}</td><td style={td}><span style={{background:u.role==="admin"?"#eff6ff":"#f0fdf4",color:u.role==="admin"?"#1d4ed8":"#15803d",fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:"bold"}}>{u.role}</span></td><td style={{...td,fontSize:11}}>{u.staffType||"teaching"}</td><td style={td}><button onClick={()=>{setResetTarget(u);setNPw("");setRMsg("");}} style={{color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",fontSize:11,marginRight:8}}>Reset PW</button><button onClick={()=>doDel(u.id)} style={{color:"#b91c1c",background:"none",border:"none",cursor:"pointer",fontSize:11}}>Delete</button></td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PARENT VIEW
// ══════════════════════════════════════════════════════════
function ParentView({user,students,results,comments,fees,term,setTerm,year,setYear,examType,setExamType,announcements,logo}) {
  const student=students.find(s=>s.id===user.studentId);
  const [tab,setTab]=useState("report");
  if(!student) return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:40}}>⚠️</div><div style={{color:"#b91c1c",marginTop:12}}>Student record not found. Contact school office.</div></div>;
  const stuFees=fees.filter(f=>f.studentId===student.id);
  const recentAnn=(announcements||[]).slice(-5).reverse();
  const th={textAlign:"left",padding:"9px 12px",fontWeight:"bold",fontSize:11,color:"#1d4ed8",background:"#eff6ff"};
  const td={padding:"8px 12px",fontSize:12,borderTop:"1px solid #f1f5f9"};
  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22,background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
        <Avatar name={student.name} photo={student.photo} size={64}/>
        <div><div style={{fontSize:18,fontWeight:"bold",color:"#1e3a5f"}}>{student.name}</div><div style={{fontSize:12,color:"#64748b"}}>{student.class} · Adm: {student.admNo}</div><div style={{fontSize:12,color:"#64748b"}}>{student.parentName&&`Parent: ${student.parentName}`}</div></div>
        <div style={{marginLeft:"auto"}}><LiveClock/></div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[["report","📋 Report"],["fees","💰 Fees"],["notices","📌 Notices"]].map(([t,l])=><Btn key={t} onClick={()=>setTab(t)} v={tab===t?"primary":"ghost"} style={{fontSize:12}}>{l}</Btn>)}</div>
      {tab==="report"&&<><div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}><Sel value={term} onChange={setTerm} options={TERMS}/><Sel value={examType} onChange={setExamType} options={EXAM_TYPES}/><Sel value={year} onChange={setYear} options={YEARS}/></div><ReportCard student={student} results={results} comments={comments} term={term} year={year} examType={examType} isParent logo={logo}/></>}
      {tab==="fees"&&(()=>{
        const sDue=stuFees.reduce((a,b)=>a+(b.amount||0),0);
        const sPaid=stuFees.reduce((a,b)=>a+(b.paid||0),0);
        const sBal=sDue-sPaid;
        return(<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:"#eff6ff",borderRadius:12,padding:"14px 16px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Total Due</div><div style={{fontSize:18,fontWeight:"bold",color:"#b45309"}}>KES {sDue.toLocaleString()}</div></div>
            <div style={{background:"#f0fdf4",borderRadius:12,padding:"14px 16px",textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Total Paid</div><div style={{fontSize:18,fontWeight:"bold",color:"#15803d"}}>KES {sPaid.toLocaleString()}</div></div>
            <div style={{background:sBal>0?"#fef2f2":"#f0fdf4",borderRadius:12,padding:"14px 16px",textAlign:"center",border:sBal>0?"2px solid #fecaca":"2px solid #bbf7d0"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Balance Outstanding ⚡</div><div style={{fontSize:20,fontWeight:"bold",color:sBal>0?"#b91c1c":"#15803d"}}>{sBal>0?`KES ${sBal.toLocaleString()}`:"✅ CLEARED"}</div><div style={{fontSize:10,color:"#94a3b8"}}>auto-calculated</div></div>
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",background:"#eff6ff",fontWeight:"bold",color:"#1e3a5f",fontSize:13,borderBottom:"1px solid #dbeafe"}}>Fee Statement — {student.name} ({stuFees.length} records)</div>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
              <thead><tr>{["Fee Type","Term","Year","Due","Paid","Balance ⚡","Method","Date"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {stuFees.length?stuFees.map((f,i)=>{const bal=(f.amount||0)-(f.paid||0); return(<tr key={f.id} style={{background:i%2===0?"white":"#fafafa"}}><td style={{...td}}>{f.feeType}</td><td style={td}>{f.term}</td><td style={td}>{f.year}</td><td style={{...td,color:"#b45309",fontWeight:"bold"}}>KES {(f.amount||0).toLocaleString()}</td><td style={{...td,color:"#15803d",fontWeight:"bold"}}>KES {(f.paid||0).toLocaleString()}</td><td style={{...td,fontWeight:"bold",fontSize:13,color:bal>0?"#b91c1c":"#15803d"}}>{bal>0?`KES ${bal.toLocaleString()}`:"✅ CLEAR"}</td><td style={td}>{f.payMethod||"—"}</td><td style={td}>{f.payDate||"—"}</td></tr>);}):<tr><td colSpan={8} style={{padding:30,textAlign:"center",color:"#94a3b8"}}>No fee records yet. Contact the school office.</td></tr>}
                {stuFees.length>0&&<tr style={{background:"#f0fdf4",fontWeight:"bold"}}><td colSpan={3} style={{padding:"10px 12px",fontSize:12,color:"#15803d"}}>TOTALS</td><td style={{padding:"10px 12px",color:"#b45309"}}>KES {sDue.toLocaleString()}</td><td style={{padding:"10px 12px",color:"#15803d"}}>KES {sPaid.toLocaleString()}</td><td style={{padding:"10px 12px",color:sBal>0?"#b91c1c":"#15803d"}}>KES {sBal.toLocaleString()}</td><td colSpan={2}/></tr>}
              </tbody>
            </table></div>
          </Card>
        </div>);
      })()}
      {tab==="notices"&&<div style={{display:"grid",gap:12}}>{recentAnn.length?recentAnn.map(a=><Card key={a.id} style={{borderLeft:"4px solid #1d4ed8",padding:"12px 16px"}}><div style={{fontWeight:"bold",color:"#1e3a5f",marginBottom:4}}>{a.title}</div><div style={{fontSize:12,color:"#374151"}}>{a.body}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>{a.date}</div></Card>):<Empty icon="📌" text="No notices."/>}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [ready,setReady]=useState(false);
  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [users,setUsers]=useState(DEFAULT_USERS);
  const [students,setStudents]=useState([]);
  const [results,setResults]=useState([]);
  const [comments,setComments]=useState([]);
  const [announcements,setAnnouncements]=useState([]);
  const [fees,setFees]=useState([]);
  const [staff,setStaff]=useState([]);
  const [term,setTerm]=useState("Term 1");
  const [year,setYear]=useState(String(new Date().getFullYear()));
  const [examType,setExamType]=useState("End Term Exam");
  const [logo,setLogo]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const [u,s,r,c,a,f,st,lg,tt,cfg]=await Promise.all([
          sbGet("users"), sbGet("students"), sbGet("results"), sbGet("comments"),
          sbGet("announcements"), sbGet("fees"), sbGet("staff"),
          loadSetting("logo"), loadSetting("timetable"), loadSetting("ttcfg")
        ]);
        if(u&&u.length) setUsers(u); 
        else { await sbUpsertMany("users", DEFAULT_USERS); }
        if(s&&s.length) setStudents(s); 
        if(r&&r.length) setResults(r);
        if(c&&c.length) setComments(c); 
        if(a&&a.length) setAnnouncements(a); 
        if(f&&f.length) setFees(f); 
        if(st&&st.length) setStaff(st);
        if(lg) setLogo(lg);
      } catch(e) { console.error("Load error",e); }
      setReady(true);
    })();
  },[]);

  if(!ready) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"linear-gradient(135deg,#1e3a5f,#15803d)",fontFamily:F}}><div style={{textAlign:"center",color:"white"}}><Logo size={90} src={OFFICIAL_LOGO}/><div style={{fontSize:18,fontWeight:"bold",marginTop:14}}>Loading TNKS System…</div><div style={{fontSize:13,opacity:.8,marginTop:6}}>{SCHOOL.name}</div><div style={{marginTop:16,display:"flex",gap:6,justifyContent:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"white",opacity:.6,animation:`pulse ${0.8+i*0.2}s infinite alternate`}}/>)}</div></div></div>;

  if(!user) return <LoginPage users={users} setUsers={setUsers} students={students} onLogin={setUser} logo={logo}/>;

  const ctx={user,students,setStudents,results,setResults,comments,setComments,announcements,setAnnouncements,users,setUsers,fees,setFees,staff,setStaff,term,setTerm,year,setYear,examType,setExamType,logo};

  if(user.role==="parent") return (
    <div style={{display:"flex",height:"100vh",fontFamily:F,background:"#f1f5f9",overflow:"hidden"}}>
      <Sidebar view={view} setView={setView} user={user} onLogout={()=>{setUser(null);setView("dashboard");}} logo={logo} open={sidebarOpen} onToggle={()=>setSidebarOpen(p=>!p)}/>
      <main style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#15803d)",color:"white",padding:"6px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,flexShrink:0,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}><span>📍 {SCHOOL.location}</span><span>📞 {SCHOOL.phone}</span><span>✉️ {SCHOOL.email}</span></div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",opacity:.85}}><span>🌐 {SCHOOL.website}</span><span style={{fontStyle:"italic"}}>"{SCHOOL.motto}"</span></div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {view==="noticeboard"?<NoticeBoard {...ctx}/>:<ParentView {...ctx}/>}
        </div>
      </main>
      <Analytics />
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:F,background:"#f1f5f9",overflow:"hidden"}}>
      <Sidebar view={view} setView={setView} user={user} onLogout={()=>{setUser(null);setView("dashboard");}} logo={logo} open={sidebarOpen} onToggle={()=>setSidebarOpen(p=>!p)}/>
      <main style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#15803d)",color:"white",padding:"6px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,flexShrink:0,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <span>📍 {SCHOOL.location}</span>
            <span>📞 {SCHOOL.phone}</span>
            <span>✉️ {SCHOOL.email}</span>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",opacity:.85}}>
            <span>🌐 {SCHOOL.website}</span>
            <span>📅 Est. {SCHOOL.founded}</span>
            <span style={{fontStyle:"italic"}}>"{SCHOOL.motto}"</span>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
        {view==="dashboard"&&<Dashboard {...ctx}/>}
        {view==="students"&&<StudentsPage students={students} setStudents={setStudents} fees={fees} setFees={setFees}/>}
        {view==="admissions"&&<AdmissionsPage students={students} setStudents={setStudents}/>}
        {view==="results"&&<ResultsPage {...ctx}/>}
        {view==="analytics"&&<AnalyticsPage {...ctx}/>}
        {view==="reports"&&<ReportsPage {...ctx}/>}
        {view==="fees"&&<FeesPage students={students} fees={fees} setFees={setFees} user={user}/>}
        {view==="timetable"&&<TimetablePage students={students} staff={staff} user={user}/>}
        {view==="attendance"&&<AttendancePage {...ctx}/>}
        {view==="timeinout"&&<TimeInOutPage students={students} staff={staff} user={user}/>}
        {view==="staff"&&user.role==="admin"&&<StaffPage staff={staff} setStaff={setStaff} users={users} setUsers={setUsers}/>}
        {view==="staff"&&user.role!=="admin"&&<div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Admin access required.</div>}
        {view==="duty"&&<DutyPage staff={staff} user={user}/>}
        {view==="council"&&<CouncilPage students={students} user={user}/>}
        {view==="library"&&<LibraryPage/>}
        {view==="events"&&<EventsPage user={user}/>}
        {view==="noticeboard"&&<NoticeBoard {...ctx}/>}
        {view==="settings"&&user.role==="admin"&&<SettingsPage users={users} setUsers={setUsers} logo={logo} setLogo={setLogo}/>}
        {view==="settings"&&user.role!=="admin"&&<div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Admin access required.</div>}
        </div>
      </main>
      <Analytics />
    </div>
  );
}
