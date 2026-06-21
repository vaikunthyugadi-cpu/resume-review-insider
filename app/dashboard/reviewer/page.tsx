import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NotificationCenter } from "@/components/notification-center";
import { requireProfile } from "@/lib/auth";

type QueueRow = { id:string; status:string; target_role:string; created_at:string; hunter_id:string; claimed_by:string|null; hunter_name?:string };
type NotificationRow = { id:string; title:string; message:string; link:string|null; read_at:string|null; created_at:string };
type EarningRow = { id:string; request_id:string; amount_pence:number; created_at:string; paid_at:string|null };

export default async function ReviewerDashboard(){
  const {supabase,profile}=await requireProfile("reviewer");
  await supabase.rpc("release_expired_reviews");
  const [{data,error:requestsError},{data:notificationData},{data:earningData}]=await Promise.all([
    profile.work_email_verified ? supabase.from("review_requests").select("id, status, target_role, created_at, hunter_id, claimed_by").in("status",["open","claimed","completed"]).order("created_at",{ascending:false}) : Promise.resolve({data:[],error:null}),
    supabase.from("notifications").select("id, title, message, link, read_at, created_at").eq("user_id",profile.id).order("created_at",{ascending:false}).limit(8),
    supabase.from("reviewer_earnings").select("id, request_id, amount_pence, created_at, paid_at").eq("reviewer_id",profile.id).order("created_at",{ascending:false}).limit(20)
  ]);
  const all=(data??[]) as unknown as QueueRow[];
  const hunterIds=[...new Set(all.map(item=>item.hunter_id))];
  const {data:hunters}=hunterIds.length?await supabase.from("users_profile").select("id, full_name").in("id",hunterIds):{data:[]};
  const names=new Map((hunters??[]).map(h=>[h.id,h.full_name])); all.forEach(item=>{item.hunter_name=names.get(item.hunter_id)??"Candidate"});
  const queue=all.filter(item=>item.status==="open");
  const claimed=all.filter(item=>item.status==="claimed"&&item.claimed_by===profile.id);
  const completed=all.filter(item=>item.status==="completed"&&item.claimed_by===profile.id);
  const notifications=((notificationData??[]) as NotificationRow[]).filter(item=>item.title!=="New resume request"||queue.length>0);
  const earnings=(earningData??[]) as EarningRow[]; const total=earnings.reduce((sum,item)=>sum+item.amount_pence,0);
  return <DashboardShell profile={profile} active="overview">
    <div className="page-heading"><div><h1>Reviews at a glance</h1><p>Help candidates sharpen their story. Earnings unlock after strong Hunter scores.</p></div></div>
    {requestsError&&<p className="form-error" role="alert">Reviews could not be loaded. Please refresh and try again.</p>}
    <NotificationCenter initialItems={notifications} />
    <section className="stat-grid"><Stat label="Open requests" value={queue.length} note={`For ${profile.company_name??"your company"}`} /><Stat label="In progress" value={claimed.length} note="Claimed reviews" /><Stat label="Completed" value={completed.length} note="Available history" /><Stat label="Recorded earnings" value={`£${(total/100).toFixed(2)}`} note="Unlocked above 7/10" /></section>
    {!profile.work_email_verified&&<section className="panel verification-banner"><strong>Verify your work email to start reviewing</strong><p>Confirm the link sent to your company email. An administrator can also review your account if additional verification is needed.</p></section>}
    {profile.work_email_verified&&<><section className="panel" id="queue"><div className="panel-heading"><div><h2>Open review queue</h2><p>Requests are limited to your verified company. The first reviewer to start claims the work for 48 hours.</p></div><span className="live-pill">Live queue</span></div>{queue.length?<div className="queue-list">{queue.map(item=><article className="queue-row" key={item.id}><span className="avatar">{initials(item.hunter_name)}</span><div><strong>{item.hunter_name}</strong><small>{item.target_role}</small></div><span className="date-note">{new Date(item.created_at).toLocaleDateString()}</span><Link className="button button-primary" href={`/dashboard/reviewer/reviews/${item.id}`}>Start review</Link></article>)}</div>:<div className="empty-inline"><strong>The queue is clear</strong><span>New submissions for {profile.company_name} will appear here.</span></div>}</section>
    <section className="panel" id="completed"><div className="panel-heading"><div><h2>Your reviews</h2><p>Claimed and completed candidate reviews.</p></div></div>{[...claimed,...completed].length?<div className="data-list">{[...claimed,...completed].map(item=><Link className="data-row" href={`/dashboard/reviewer/reviews/${item.id}`} key={item.id}><span className="avatar">{initials(item.hunter_name)}</span><div className="row-main"><strong>{item.hunter_name}</strong><small>{item.target_role}</small></div><span className={`status status-${item.status}`}>{item.status==="claimed"?"In progress":"Completed"}</span><span className="row-arrow">›</span></Link>)}</div>:<div className="empty-inline"><strong>No claimed reviews yet</strong><span>Choose an available candidate above to begin.</span></div>}</section>
    <section className="panel"><div className="panel-heading"><div><h2>Earnings history</h2><p>£1.00 appears only after the Hunter scores your completed review above 7/10.</p></div></div>{earnings.length?<div className="data-list">{earnings.map(item=><div className="data-row earning-row" key={item.id}><span className="company-logo">£</span><div className="row-main"><strong>Resume review earning</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></div><span className={item.paid_at?"status status-completed":"status status-claimed"}>{item.paid_at?"Paid":"Pending payout"}</span><strong>£{(item.amount_pence/100).toFixed(2)}</strong></div>)}</div>:<div className="empty-inline"><strong>No earnings yet</strong><span>Earnings appear after completed reviews receive a Hunter score above 7/10.</span></div>}</section></>}
  </DashboardShell>
}
function Stat({label,value,note}:{label:string;value:string|number;note:string}){return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}
function initials(name?:string){return(name??"Candidate").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()}
