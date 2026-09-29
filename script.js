const CATEGORIES=["Food","Transport","Shopping","Education","Health","Home","Entertainment","Travel","Electronics","Other"];
const ICONS={Food:"🍔",Transport:"🚗",Shopping:"🛍️",Education:"📚",Health:"💚",Home:"🏠",Entertainment:"🎮",Travel:"✈️",Electronics:"💻",Other:"📦"};
const COLORS=["#7657e8","#45a7f5","#2bc187","#ff9c48","#ef5b67","#9b67ef","#22b8a7","#f2c14e","#5d7cf5","#8990a4"];
const today=new Date(); const iso=d=>d.toISOString().slice(0,10);
const seedTransactions=[
{id:1,description:"Salary",amount:31000,type:"income",category:"Income",date:iso(new Date(today.getFullYear(),today.getMonth(),28)),note:"Monthly salary"},
{id:2,description:"Grocery",amount:100,type:"expense",category:"Food",date:iso(today),note:"Groceries"},
{id:3,description:"Bus Pass",amount:450,type:"expense",category:"Transport",date:iso(new Date(today.getFullYear(),today.getMonth(),10)),note:"Monthly travel"},
{id:4,description:"Course Materials",amount:750,type:"expense",category:"Education",date:iso(new Date(today.getFullYear(),today.getMonth(),7)),note:"Study materials"}
];
let transactions=JSON.parse(localStorage.getItem("expense_transactions")||"null")||seedTransactions;
let budgets=JSON.parse(localStorage.getItem("expense_budgets")||"null")||[
{category:"Food",limit:5000},{category:"Transport",limit:2000},{category:"Education",limit:3000}
];
let goals=JSON.parse(localStorage.getItem("expense_goals")||"null")||[
{name:"Save for Education",target:10000,current:2500},
{name:"Emergency Fund",target:25000,current:7000}
];
const $=id=>document.getElementById(id);
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const save=()=>{localStorage.setItem("expense_transactions",JSON.stringify(transactions));localStorage.setItem("expense_budgets",JSON.stringify(budgets));localStorage.setItem("expense_goals",JSON.stringify(goals));};
const monthNow=()=>new Date().getMonth();
const isCurrentMonth=d=>{const x=new Date(d);return x.getMonth()===today.getMonth()&&x.getFullYear()===today.getFullYear()};
function totals(list=transactions){return {income:list.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense:list.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)}}
function filteredPeriod(period){return period==="all"?transactions:transactions.filter(t=>isCurrentMonth(t.date))}
function populateCategories(){
  $("transactionCategory").innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join("");
  $("budgetCategory").innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join("");
  $("categoryFilter").innerHTML=`<option value="all">All Categories</option>`+CATEGORIES.map(c=>`<option>${c}</option>`).join("");
}
function render(){
  renderDashboard(); renderTransactions(); renderBudgets(); renderGoals(); renderReports();
}
function renderDashboard(){
  const list=filteredPeriod($("dashboardPeriod").value), t=totals(list), balance=t.income-t.expense, rate=t.income?Math.max(0,(balance/t.income)*100):0;
  $("balanceValue").textContent=money(balance);$("incomeValue").textContent=money(t.income);$("expenseValue").textContent=money(t.expense);$("savingValue").textContent=rate.toFixed(1)+"%";
  $("balanceNote").textContent=balance>=0?"You're within your income":"Expenses are above income";
  const recent=[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  $("recentTransactions").innerHTML=recent.length?recent.map(txHTML).join(""):`<div class="empty">No transactions yet.</div>`;
  renderBudgetOverview(); renderBars(); renderDonut(list);
}
function txHTML(t,actions=true){return `<div class="transaction"><div class="tx-icon">${ICONS[t.category]||"💰"}</div><div class="tx-info"><strong>${esc(t.description)}</strong><small>${esc(t.category)} • ${formatDate(t.date)}</small></div><div class="amount ${t.type}">${t.type==="income"?"+":"-"} ${money(t.amount)}</div>${actions?`<button class="edit-btn" onclick="editTransaction(${t.id})">Edit</button><button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>`:""}</div>`}
function renderTransactions(){
  const q=$("searchInput").value.toLowerCase(), type=$("typeFilter").value, cat=$("categoryFilter").value, month=$("monthFilter").value;
  let list=transactions.filter(t=>(!q||`${t.description} ${t.category} ${t.note||""}`.toLowerCase().includes(q))&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(month!=="current"||isCurrentMonth(t.date))).sort((a,b)=>new Date(b.date)-new Date(a.date));
  $("transactionList").innerHTML=list.length?list.map(t=>txHTML(t,true)).join(""):`<div class="empty">No matching transactions found.</div>`;
}
function renderBars(){
  const months=[];for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push({name:d.toLocaleString("en",{month:"short"}),month:d.getMonth(),year:d.getFullYear()})}
  const vals=months.map(m=>{const l=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m.month&&d.getFullYear()===m.year});return totals(l)});
  const max=Math.max(1,...vals.flatMap(x=>[x.income,x.expense]));
  $("barChart").innerHTML=vals.map((v,i)=>`<div class="bar-group"><div class="bar income" style="height:${Math.max(3,v.income/max*90)}%"></div><div class="bar expense" style="height:${Math.max(3,v.expense/max*90)}%"></div><span class="bar-label">${months[i].name}</span></div>`).join("");
}
function renderDonut(list){
  const exp=list.filter(t=>t.type==="expense"), total=exp.reduce((s,t)=>s+t.amount,0);
  const by={};exp.forEach(t=>by[t.category]=(by[t.category]||0)+t.amount);
  const entries=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5);
  let start=0;const stops=entries.map((e,i)=>{const end=start+(total?e[1]/total*100:0);const x=`${COLORS[i]} ${start}% ${end}%`;start=end;return x});
  $("donutChart").style.background=entries.length?`conic-gradient(${stops.join(",")})`:"var(--border)";
  $("donutTotal").textContent=money(total);
  $("categoryLegend").innerHTML=entries.length?entries.map((e,i)=>`<div class="cat-row"><span class="cat-name"><i class="cat-dot" style="background:${COLORS[i]}"></i>${e[0]}</span><strong>${money(e[1])}</strong></div>`).join(""):`<span class="muted">No expenses yet.</span>`;
}
function renderBudgetOverview(){
  const exp=transactions.filter(t=>t.type==="expense"&&isCurrentMonth(t.date));
  $("budgetOverview").innerHTML=budgets.length?budgets.slice(0,5).map(b=>{const used=exp.filter(t=>t.category===b.category).reduce((s,t)=>s+t.amount,0),p=Math.min(100,used/b.limit*100);return `<div class="progress-row"><div class="progress-title"><span>${ICONS[b.category]||"📦"} ${b.category}</span><span>${money(used)} / ${money(b.limit)}</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`}).join(""):`<p class="muted">No budgets created.</p>`;
}
function renderBudgets(){
  const exp=transactions.filter(t=>t.type==="expense"&&isCurrentMonth(t.date));
  $("budgetGrid").innerHTML=budgets.length?budgets.map((b,i)=>{const used=exp.filter(t=>t.category===b.category).reduce((s,t)=>s+t.amount,0),p=used/b.limit*100;return `<div class="feature-card"><div class="card-top"><div class="goal-icon">${ICONS[b.category]||"📦"}</div><button class="delete-btn" onclick="deleteBudget(${i})">Delete</button></div><h3>${b.category}</h3><div class="big-number">${money(used)} <small>/ ${money(b.limit)}</small></div><div class="progress"><i style="width:${Math.min(100,p)}%"></i></div><p class="${p>100?"danger":"good"}">${p>100?"Over budget by "+money(used-b.limit):money(Math.max(0,b.limit-used))+" remaining"} • ${p.toFixed(0)}% used</p></div>`}).join(""):`<div class="feature-card"><h3>No budgets yet</h3><p>Create your first monthly budget.</p></div>`;
}
function renderGoals(){
  $("goalGrid").innerHTML=goals.length?goals.map((g,i)=>{const p=Math.min(100,g.current/g.target*100);return `<div class="feature-card"><div class="card-top"><div class="goal-icon">🎯</div><button class="delete-btn" onclick="deleteGoal(${i})">Delete</button></div><h3>${esc(g.name)}</h3><div class="big-number">${money(g.current)} <small>of ${money(g.target)}</small></div><div class="progress"><i style="width:${p}%"></i></div><p class="${p>=100?"good":""}">${p.toFixed(0)}% complete • ${p>=100?"Goal reached!":money(g.target-g.current)+" remaining"}</p><button class="text-btn" onclick="addGoalSavings(${i})">＋ Add Savings</button></div>`}).join(""):`<div class="feature-card"><h3>No goals yet</h3><p>Create a goal to start tracking your savings.</p></div>`;
}
function renderReports(){
  const list=filteredPeriod($("reportPeriod").value),t=totals(list);$("reportIncome").textContent=money(t.income);$("reportExpense").textContent=money(t.expense);$("reportSavings").textContent=money(t.income-t.expense);
  const by={};list.filter(x=>x.type==="expense").forEach(x=>by[x.category]=(by[x.category]||0)+x.amount);const entries=Object.entries(by).sort((a,b)=>b[1]-a[1]);const max=entries[0]?.[1]||1;
  $("reportCategories").innerHTML=entries.length?entries.map((e,i)=>`<div class="report-row"><div class="report-row-top"><span>${ICONS[e[0]]||"📦"} ${e[0]}</span><strong>${money(e[1])}</strong></div><div class="progress"><i style="width:${e[1]/max*100}%;background:${COLORS[i%COLORS.length]}"></i></div></div>`).join(""):`<p class="muted">No expense data.</p>`;
  const months=[];for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);const l=transactions.filter(x=>{const q=new Date(x.date);return q.getMonth()===d.getMonth()&&q.getFullYear()===d.getFullYear()});const z=totals(l);months.push({m:d.toLocaleString("en",{month:"short",year:"numeric"}),...z})}
  $("monthlySummary").innerHTML=months.map(x=>`<div class="report-row"><div class="report-row-top"><span>${x.m}</span><span><b class="good">+${money(x.income)}</b> &nbsp; <b class="danger">-${money(x.expense)}</b></span></div></div>`).join("");
}
function formatDate(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function showModal(id){$(id).classList.add("show")}function hideModal(id){$(id).classList.remove("show")}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function editTransaction(id){const t=transactions.find(x=>x.id===id);if(!t)return;$("transactionId").value=t.id;$("description").value=t.description;$("amount").value=t.amount;$("transactionType").value=t.type;$("transactionCategory").value=CATEGORIES.includes(t.category)?t.category:"Other";$("transactionDate").value=t.date;$("transactionNote").value=t.note||"";$("transactionModalTitle").textContent="Edit Transaction";showModal("transactionModal")}
function deleteTransaction(id){if(confirm("Delete this transaction?")){transactions=transactions.filter(t=>t.id!==id);save();render();toast("Transaction deleted")}}
function deleteBudget(i){budgets.splice(i,1);save();render();toast("Budget deleted")}
function deleteGoal(i){goals.splice(i,1);save();render();toast("Goal deleted")}
function addGoalSavings(i){const n=prompt("How much would you like to add to this goal?","500");if(n&&Number(n)>0){goals[i].current+=Number(n);save();render();toast("Goal updated")}}
function openNewTransaction(){ $("transactionForm").reset();$("transactionId").value="";$("transactionDate").value=iso(today);$("transactionCategory").value="Food";$("transactionModalTitle").textContent="Add Transaction";showModal("transactionModal")}

document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.page)));
document.querySelectorAll(".text-btn[data-page]").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.page)));
function goPage(page){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));$(page+"Page").classList.add("active-page");document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===page));const names={dashboard:["Dashboard","Here's your financial overview"],transactions:["Transactions","Manage your income and expenses"],reports:["Reports","Analyze your financial activity"],budgets:["Budgets","Set and monitor spending limits"],goals:["Goals","Track your savings targets"]};$("pageTitle").textContent=names[page][0];$("pageSubtitle").textContent=names[page][1];$("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"})}
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("openTransaction").onclick=openNewTransaction;$("openTransaction2").onclick=openNewTransaction;
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>hideModal(b.dataset.close));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
$("transactionForm").onsubmit=e=>{e.preventDefault();const id=Number($("transactionId").value),obj={id:id||Date.now(),description:$("description").value.trim(),amount:Number($("amount").value),type:$("transactionType").value,category:$("transactionCategory").value,date:$("transactionDate").value,note:$("transactionNote").value.trim()};if(id)transactions=transactions.map(t=>t.id===id?obj:t);else transactions.push(obj);save();hideModal("transactionModal");render();toast(id?"Transaction updated":"Transaction added")};
$("budgetForm").onsubmit=e=>{e.preventDefault();const c=$("budgetCategory").value,l=Number($("budgetLimit").value);budgets.push({category:c,limit:l});save();hideModal("budgetModal");render();e.target.reset();toast("Budget created")};
$("goalForm").onsubmit=e=>{e.preventDefault();goals.push({name:$("goalName").value.trim(),target:Number($("goalTarget").value),current:Number($("goalCurrent").value)});save();hideModal("goalModal");render();e.target.reset();toast("Goal created")};
$("openBudget").onclick=()=>showModal("budgetModal");$("openGoal").onclick=()=>showModal("goalModal");
["searchInput","typeFilter","categoryFilter","monthFilter"].forEach(id=>$(id).addEventListener("input",renderTransactions));
$("dashboardPeriod").onchange=renderDashboard;$("reportPeriod").onchange=renderReports;
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("expense_theme",document.body.classList.contains("dark")?"dark":"light")};
$("resetBtn").onclick=()=>{if(confirm("Reset all transactions, budgets and goals to demo data?")){localStorage.clear();location.reload()}};
$("notifyBtn").onclick=()=>toast("You have "+transactions.filter(t=>t.type==="expense"&&isCurrentMonth(t.date)).length+" expenses this month.");
if(localStorage.getItem("expense_theme")==="dark")document.body.classList.add("dark");
populateCategories();render();
