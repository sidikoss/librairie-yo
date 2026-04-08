// AdminPanel.jsx — chargé uniquement quand l'admin se connecte
// ~35% du code total isolé ici → bundle client réduit d'autant

const fmtGNF  = n   => (n||0).toLocaleString("fr-FR")+" GNF";
const fmtDate = ts  => ts ? new Date(ts).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "";

function exportCSV(orders) {
  const H = ["Nom","Téléphone","Livres","Total GNF","Transaction OM","Statut","Date","Code promo","Réduction"];
  const R = orders.map(o=>[o.name,o.phone,(o.items||[]).map(i=>`${i.title} x${i.qty}`).join(" | "),o.total,o.txId,o.status,fmtDate(o.createdAt),o.promoCode||"",o.discount||""]);
  const csv = [H,...R].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));
  a.download = `commandes-yo-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

export default function AdminPanel({
  books, adminOrders, promoCodes,
  adminTab, setAdminTab,
  adminSearch, setAdminSearch,
  orderSearch, setOrderSearch,
  pendingCount, statsData,
  filteredAdminBooks, filteredOrders,
  onAddBook, onSetOrderStatus,
  onAddPromo, onTogglePromo, onDeletePromo,
  promoForm, setPromoForm,
  onClose,
  BookCard,
}) {
  const EMOJIS = ["📚","📖","✨","🌙","💡","🔥","⭐","🌿","🦋","🎯","💰","🌹","🗺️","⚔️","🔮","🧠","🏆","⚡","🌍","🕌"];
  const CATS = [
    "Roman","Science","Histoire","Philosophie","Manga",
    "Religion & Spiritualité","Développement personnel","Informatique",
    "Jeunesse","Poésie","Biographie","Entrepreneur",
    "Étudiant","Lycéen","Finance & Investissement",
    "Santé & Bien-être","Art & Créativité","Géopolitique",
    "Langues","Psychologie","Autre"
  ];

  return (
    <div className="page">
      <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Retour</button>
        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.35rem",color:"var(--cream)"}}>Administration</span>
      </div>
      <div className="admin-tabs">
        <button className={`tab ${adminTab==="stats"?"active":""}`}  onClick={()=>setAdminTab("stats")}>📊 Stats</button>
        <button className={`tab ${adminTab==="books"?"active":""}`}  onClick={()=>setAdminTab("books")}>📚 Catalogue</button>
        <button className={`tab ${adminTab==="orders"?"active":""}`} onClick={()=>setAdminTab("orders")}>
          📦 Commandes{pendingCount>0&&<span className="badge" style={{marginLeft:".3rem"}}>{pendingCount}</span>}
          <span className="live-badge"><span className="live-dot"/>LIVE</span>
        </button>
        <button className={`tab ${adminTab==="promos"?"active":""}`} onClick={()=>setAdminTab("promos")}>🏷️ Promos</button>
      </div>

      {/* ── STATS ── */}
      {adminTab==="stats"&&<>
        <div className="stats-grid">
          {[
            {icon:"💰",val:fmtGNF(statsData.totalRevenue),lbl:"Revenus totaux"},
            {icon:"📅",val:fmtGNF(statsData.monthRevenue),lbl:"Ce mois-ci"},
            {icon:"📦",val:adminOrders.length,lbl:"Total commandes"},
            {icon:"⏳",val:statsData.pending,lbl:"En attente"},
            {icon:"✅",val:statsData.approved,lbl:"Approuvées"},
            {icon:"❌",val:statsData.rejected,lbl:"Rejetées"},
            {icon:"📚",val:books.length,lbl:"Livres publiés"},
            {icon:"❤️",val:books.filter(b=>b.featured).length,lbl:"Mis en avant"},
          ].map(s=>(
            <div key={s.lbl} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
        {statsData.topBooks.length>0&&<>
          <div className="grid-title" style={{marginBottom:"1rem"}}>🏆 Top livres vendus</div>
          {statsData.topBooks.map((b,i)=>(
            <div key={b.title} className="top-book-row">
              <span style={{color:"var(--gold)",fontWeight:700,fontSize:"1rem",width:20}}>#{i+1}</span>
              <span style={{flex:1,color:"var(--text)",fontSize:".88rem"}}>{b.title}</span>
              <span style={{color:"var(--gold)",fontWeight:700}}>{b.count} vendu{b.count>1?"s":""}</span>
            </div>
          ))}
        </>}
        {adminOrders.length>0&&<div style={{marginTop:"1.5rem"}}><button className="btn btn-ghost" onClick={()=>exportCSV(adminOrders)}>📥 Exporter (CSV)</button></div>}
      </>}

      {/* ── CATALOGUE ── */}
      {adminTab==="books"&&<>
        <div style={{display:"flex",gap:".7rem",marginBottom:"1.2rem",alignItems:"center",flexWrap:"wrap"}}>
          <button className="btn btn-gold" onClick={onAddBook}>+ Nouveau livre</button>
          <input className="search-input" style={{flex:1,minWidth:200,marginBottom:0}} placeholder="Rechercher…" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)}/>
        </div>
        {filteredAdminBooks.length===0
          ?<div className="empty"><p>Aucun livre trouvé</p></div>
          :<div className="grid">{filteredAdminBooks.map(b=><BookCard key={b.fbKey} b={b} admin={true}/>)}</div>}
      </>}

      {/* ── COMMANDES ── */}
      {adminTab==="orders"&&<>
        <div style={{display:"flex",gap:".7rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          <input className="search-input" style={{flex:1,marginBottom:0}} placeholder="Nom, téléphone, ID transaction…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(filteredOrders)}>📥 CSV</button>
        </div>
        {filteredOrders.length===0&&<div className="empty"><div style={{fontSize:"2rem",marginBottom:".5rem"}}>📭</div><p>Aucune commande</p></div>}
        {filteredOrders.map(order=>(
          <div key={order.fbKey} className="order-row">
            <div className="order-row-head">
              <div className="order-meta">
                <strong>{order.name}</strong><br/>📞 {order.phone}<br/>🕐 {fmtDate(order.createdAt)}
                {order.promoCode&&<><br/>🏷️ <span style={{color:"var(--gold)"}}>{order.promoCode}</span> (-{fmtGNF(order.discount||0)})</>}
              </div>
              <div style={{textAlign:"right"}}>
                <span className={`status-badge status-${order.status}`}>
                  {order.status==="pending"?"⏳ En attente":order.status==="approved"?"✅ Approuvée":"❌ Rejetée"}
                </span>
                <div style={{marginTop:".4rem",color:"var(--gold)",fontWeight:700,fontSize:".9rem"}}>{fmtGNF(order.total)}</div>
                {order.originalTotal&&order.originalTotal!==order.total&&<div style={{fontSize:".7rem",color:"var(--muted)",textDecoration:"line-through"}}>{fmtGNF(order.originalTotal)}</div>}
              </div>
            </div>
            <div className="order-items">
              {(order.items||[]).map((it,i)=><div key={i}>{it.emoji||"📚"} {it.title} × {it.qty} — <span style={{color:"var(--gold)"}}>{fmtGNF(it.price)}</span></div>)}
            </div>
            <div><span style={{fontSize:".72rem",color:"var(--muted)"}}>ID transaction OM : </span><span className="order-tx">{order.txId}</span></div>
            {order.status==="pending"&&(
              <div className="order-actions">
                <button className="btn btn-green btn-sm" onClick={()=>onSetOrderStatus(order.fbKey,"approved")}>✅ Valider</button>
                <button className="btn btn-red btn-sm"   onClick={()=>onSetOrderStatus(order.fbKey,"rejected")}>❌ Rejeter</button>
              </div>
            )}
            {order.status!=="pending"&&order.reviewedAt&&(
              <div style={{fontSize:".72rem",color:order.status==="approved"?"var(--green)":"#f08080",marginTop:".5rem"}}>
                {order.status==="approved"?"✅ Validé":"❌ Rejeté"} le {fmtDate(order.reviewedAt)}
              </div>
            )}
          </div>
        ))}
      </>}

      {/* ── PROMOS ── */}
      {adminTab==="promos"&&<>
        <div className="promo-form">
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.1rem",color:"var(--cream)",marginBottom:"1rem"}}>🏷️ Créer un code promo</div>
          <div className="fr">
            <div className="fg"><label className="fl">Code</label><input className="fi" style={{textTransform:"uppercase"}} value={promoForm.code} onChange={e=>setPromoForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="EX: YO20"/></div>
            <div className="fg"><label className="fl">Réduction</label><input className="fi" type="number" value={promoForm.discount} onChange={e=>setPromoForm(p=>({...p,discount:e.target.value}))} placeholder="20"/></div>
          </div>
          <div className="fr">
            <div className="fg"><label className="fl">Type</label><select className="fs" value={promoForm.type} onChange={e=>setPromoForm(p=>({...p,type:e.target.value}))}><option value="percent">% Pourcentage</option><option value="fixed">Montant fixe (GNF)</option></select></div>
            <div className="fg"><label className="fl">Utilisations max</label><input className="fi" type="number" value={promoForm.maxUses} onChange={e=>setPromoForm(p=>({...p,maxUses:e.target.value}))}/></div>
          </div>
          <button className="btn btn-gold" onClick={onAddPromo}>+ Créer le code</button>
        </div>
        {promoCodes.length===0&&<div className="empty"><p>Aucun code promo créé</p></div>}
        {[...promoCodes].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(p=>(
          <div key={p.fbKey} className="promo-code-row">
            <div className="promo-code-label" style={{color:p.active?"var(--gold)":"var(--muted)"}}>{p.code}</div>
            <div style={{flex:1,fontSize:".8rem",color:"var(--muted)"}}>{p.type==="percent"?`-${p.discount}%`:`-${fmtGNF(p.discount)}`}{" · "}{p.uses||0}/{p.maxUses||"∞"} utilisations</div>
            <span className={`status-badge ${p.active?"status-approved":"status-rejected"}`}>{p.active?"Actif":"Inactif"}</span>
            <div style={{display:"flex",gap:".4rem"}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>onTogglePromo(p)}>{p.active?"Désactiver":"Activer"}</button>
              <button className="btn btn-red btn-sm"   onClick={()=>onDeletePromo(p)}>🗑️</button>
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
