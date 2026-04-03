// ═══════════════════════════════════════════════════════════════
//  LIBRAIRIE YO — src/App.jsx
//  Stack : React 18 + Firebase 10 + Vite
//  Paiement : Orange Money (validation manuelle admin)
//  Sécurité : PDF jamais exposé côté client
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc,
  doc, query, orderBy, limit, startAfter, where,
  onSnapshot, serverTimestamp, getDoc,
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, getDownloadURL,
} from "firebase/storage";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
} from "firebase/auth";

// ─── 1. FIREBASE CONFIG ──────────────────────────────────────
// Remplace par ta vraie config (voir README.md étape 2)
const firebaseConfig = {
  apiKey:            "REMPLACE_API_KEY",
  authDomain:        "REMPLACE.firebaseapp.com",
  databaseURL:       "https://REMPLACE-default-rtdb.firebaseio.com",
  projectId:         "REMPLACE_PROJECT_ID",
  storageBucket:     "REMPLACE.appspot.com",
  messagingSenderId: "REMPLACE_SENDER_ID",
  appId:             "REMPLACE_APP_ID",
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);
const auth    = getAuth(app);

// ─── 2. CONSTANTES ──────────────────────────────────────────
const ADMIN_PASSWORD  = "papiraro2143";
const ORANGE_MONEY_NR = "224613908784";
const PAGE_SIZE       = 12; // livres par page (lazy loading)

// ─── 3. DONNÉES DE DÉMONSTRATION ─────────────────────────────
// Utilisées si Firebase n'est pas encore configuré
const DEMO_BOOKS = [
  { id:"d1", title:"L'Aventure Africaine", author:"Kofi Mensah", price:15000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=70", category:"Roman", description:"Un voyage épique à travers les savanes et les villes d'Afrique de l'Ouest, racontant l'histoire de trois amis qui partent à la découverte de leurs racines.", pages:320 },
  { id:"d2", title:"Mathématiques pour Tous", author:"Dr. Aminata Bah", price:25000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300&q=70", category:"Éducation", description:"Un guide complet des mathématiques, du niveau collège jusqu'au baccalauréat. Exercices corrigés inclus.", pages:480 },
  { id:"d3", title:"Contes de Guinée", author:"Mamadou Diallo", price:8000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=70", category:"Contes", description:"Recueil des plus beaux contes traditionnels de Guinée, transmis de génération en génération.", pages:180 },
  { id:"d4", title:"Guide Entrepreneuriat", author:"Fatoumata Camara", price:30000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=70", category:"Business", description:"Tout ce qu'il faut savoir pour lancer et développer son entreprise en Afrique de l'Ouest.", pages:250 },
  { id:"d5", title:"Poèmes de l'Harmattan", author:"Ibrahim Touré", price:6000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=70", category:"Poésie", description:"Des vers qui capturent l'essence de la saison sèche, de la poussière rouge et des espoirs humains.", pages:120 },
  { id:"d6", title:"Histoire de l'Afrique", author:"Prof. Sekou Barry", price:35000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&q=70", category:"Histoire", description:"Une fresque historique complète de l'Afrique, des royaumes anciens à l'époque contemporaine.", pages:650 },
  { id:"d7", title:"Cuisine Guinéenne", author:"Aïssatou Sow", price:12000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&q=70", category:"Cuisine", description:"Plus de 80 recettes traditionnelles guinéennes avec des instructions détaillées et des photos.", pages:200 },
  { id:"d8", title:"Santé Naturelle", author:"Dr. Kadiatou Balde", price:20000, currency:"GNF", coverUrl:"https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=300&q=70", category:"Santé", description:"Les plantes médicinales africaines et leurs usages traditionnels, validés par la recherche moderne.", pages:310 },
];

// ─── 4. STYLES CSS ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #1a1208;
    --ink2:     #3d3120;
    --ink3:     #6b5c45;
    --cream:    #fdf8f0;
    --cream2:   #f5ece0;
    --gold:     #c8922a;
    --gold2:    #e6a93a;
    --terra:    #c4532a;
    --terra2:   #e06040;
    --sage:     #2d6a4f;
    --shadow:   rgba(26,18,8,0.12);
    --shadow2:  rgba(26,18,8,0.22);
    --radius:   14px;
    --font-h:   'Playfair Display', Georgia, serif;
    --font-b:   'DM Sans', system-ui, sans-serif;
    --trans:    0.22s cubic-bezier(.4,0,.2,1);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-b);
    background: var(--cream);
    color: var(--ink);
    line-height: 1.6;
    min-height: 100vh;
  }

  /* ── SPLASH ── */
  .splash {
    position: fixed; inset: 0; z-index: 1000;
    background: var(--ink);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
    transition: opacity 0.7s ease, visibility 0.7s ease;
  }
  .splash.hidden { opacity: 0; visibility: hidden; pointer-events: none; }

  .splash-logo {
    width: 90px; height: 90px; border-radius: 22px;
    background: linear-gradient(135deg, var(--gold), var(--terra));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-h); font-size: 2.4rem; color: #fff;
    animation: logoIn 0.6s cubic-bezier(.34,1.56,.64,1) both;
    box-shadow: 0 20px 60px rgba(200,146,42,0.4);
  }
  .splash-title {
    font-family: var(--font-h); font-size: clamp(2rem, 5vw, 3rem);
    color: #fff; animation: fadeUp 0.5s 0.3s both;
  }
  .splash-slogan {
    font-size: 1.05rem; color: rgba(255,255,255,0.6);
    animation: fadeUp 0.5s 0.5s both; letter-spacing: 0.04em;
  }
  .splash-bar {
    width: 160px; height: 2px; background: rgba(255,255,255,0.12);
    border-radius: 2px; overflow: hidden; animation: fadeUp 0.5s 0.7s both;
  }
  .splash-progress {
    height: 100%; background: var(--gold);
    animation: loadBar 1.5s 0.8s cubic-bezier(.4,0,.2,1) forwards;
    width: 0;
  }

  @keyframes logoIn { from { transform: scale(0.5) rotate(-10deg); opacity: 0; } }
  @keyframes fadeUp { from { transform: translateY(16px); opacity: 0; } }
  @keyframes loadBar { to { width: 100%; } }

  /* ── HEADER ── */
  header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(253,248,240,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(200,146,42,0.15);
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px;
  }
  .header-brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; cursor: pointer;
  }
  .header-logo {
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, var(--gold), var(--terra));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-h); font-size: 1.1rem; color: #fff;
    flex-shrink: 0;
  }
  .header-name {
    font-family: var(--font-h); font-size: 1.35rem;
    color: var(--ink); font-weight: 700;
  }
  .header-actions { display: flex; align-items: center; gap: 10px; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 100px;
    border: none; cursor: pointer; font-family: var(--font-b);
    font-size: 0.9rem; font-weight: 500;
    transition: all var(--trans); white-space: nowrap;
    text-decoration: none;
  }
  .btn-primary {
    background: var(--gold); color: #fff;
    box-shadow: 0 4px 16px rgba(200,146,42,0.35);
  }
  .btn-primary:hover { background: var(--gold2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(200,146,42,0.45); }
  .btn-secondary {
    background: transparent; color: var(--ink2);
    border: 1.5px solid rgba(26,18,8,0.15);
  }
  .btn-secondary:hover { background: var(--cream2); border-color: rgba(26,18,8,0.25); }
  .btn-terra {
    background: var(--terra); color: #fff;
    box-shadow: 0 4px 16px rgba(196,83,42,0.35);
  }
  .btn-terra:hover { background: var(--terra2); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--ink3); padding: 8px 12px; }
  .btn-ghost:hover { color: var(--ink); background: var(--cream2); }
  .btn-sm { padding: 7px 16px; font-size: 0.82rem; }
  .btn-full { width: 100%; justify-content: center; }

  /* ── HERO ── */
  .hero {
    background: var(--ink);
    padding: clamp(50px, 8vw, 90px) 24px clamp(40px, 6vw, 70px);
    text-align: center; position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,146,42,0.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-tag {
    display: inline-block;
    background: rgba(200,146,42,0.15); border: 1px solid rgba(200,146,42,0.3);
    color: var(--gold2); border-radius: 100px;
    padding: 5px 16px; font-size: 0.8rem; letter-spacing: 0.08em;
    text-transform: uppercase; font-weight: 500; margin-bottom: 20px;
  }
  .hero h1 {
    font-family: var(--font-h);
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    color: #fff; max-width: 700px; margin: 0 auto 18px;
    line-height: 1.15;
  }
  .hero h1 em { color: var(--gold2); font-style: normal; }
  .hero p {
    color: rgba(255,255,255,0.6); font-size: 1.05rem;
    max-width: 480px; margin: 0 auto 32px;
  }
  .hero-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 40px; margin-top: 40px; padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .stat-num { font-family: var(--font-h); font-size: 1.8rem; color: var(--gold2); }
  .stat-lbl { font-size: 0.78rem; color: rgba(255,255,255,0.5); letter-spacing: 0.06em; text-transform: uppercase; }

  /* ── SEARCH + FILTER ── */
  .controls {
    padding: 28px 24px 16px;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    max-width: 1200px; margin: 0 auto;
  }
  .search-wrap {
    flex: 1; min-width: 200px; position: relative;
  }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--ink3); pointer-events: none; }
  .search-input {
    width: 100%; padding: 11px 16px 11px 40px;
    border: 1.5px solid rgba(26,18,8,0.12);
    border-radius: 100px; background: #fff;
    font-family: var(--font-b); font-size: 0.9rem; color: var(--ink);
    transition: border-color var(--trans);
    outline: none;
  }
  .search-input:focus { border-color: var(--gold); }
  .search-input::placeholder { color: var(--ink3); }

  .filter-btn {
    padding: 10px 18px; border-radius: 100px;
    border: 1.5px solid transparent; cursor: pointer;
    font-family: var(--font-b); font-size: 0.85rem; font-weight: 500;
    background: transparent; color: var(--ink3);
    transition: all var(--trans);
  }
  .filter-btn:hover { background: var(--cream2); color: var(--ink); }
  .filter-btn.active {
    background: var(--ink); color: #fff; border-color: var(--ink);
  }

  /* ── GRID ── */
  .books-section { padding: 0 24px 60px; max-width: 1200px; margin: 0 auto; }
  .section-title {
    font-family: var(--font-h); font-size: 1.6rem;
    color: var(--ink); margin-bottom: 24px;
    display: flex; align-items: center; gap: 12px;
  }
  .section-title::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(26,18,8,0.1), transparent);
  }

  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 20px;
  }

  .book-card {
    background: #fff; border-radius: var(--radius);
    overflow: hidden; cursor: pointer;
    box-shadow: 0 2px 12px var(--shadow);
    transition: transform var(--trans), box-shadow var(--trans);
    opacity: 0; transform: translateY(20px);
    animation: cardIn 0.4s ease forwards;
  }
  .book-card:hover { transform: translateY(-5px); box-shadow: 0 12px 36px var(--shadow2); }
  @keyframes cardIn { to { opacity: 1; transform: translateY(0); } }

  .book-cover {
    width: 100%; aspect-ratio: 2/3; object-fit: cover;
    display: block; background: var(--cream2);
  }
  .book-cover-placeholder {
    width: 100%; aspect-ratio: 2/3; background: var(--cream2);
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem;
  }
  .book-info { padding: 14px; }
  .book-category {
    font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--gold); margin-bottom: 5px;
  }
  .book-title {
    font-family: var(--font-h); font-size: 1rem;
    color: var(--ink); margin-bottom: 3px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .book-author { font-size: 0.8rem; color: var(--ink3); margin-bottom: 12px; }
  .book-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .book-price { font-weight: 600; font-size: 0.95rem; color: var(--ink); }
  .book-buy {
    padding: 7px 14px; border-radius: 100px;
    background: var(--gold); color: #fff;
    border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600;
    font-family: var(--font-b);
    transition: all var(--trans);
  }
  .book-buy:hover { background: var(--gold2); transform: scale(1.05); }

  /* ── SENTINEL (infinite scroll) ── */
  .sentinel { height: 40px; width: 100%; }
  .loading-more {
    text-align: center; padding: 24px;
    color: var(--ink3); font-size: 0.9rem;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .spinner {
    width: 20px; height: 20px; border: 2px solid rgba(200,146,42,0.2);
    border-top-color: var(--gold); border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── MODAL OVERLAY ── */
  .overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,18,8,0.55);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
    animation: overlayIn 0.25s ease;
  }
  @media (min-width: 600px) {
    .overlay { align-items: center; padding: 24px; }
  }
  @keyframes overlayIn { from { opacity: 0; } }

  .modal {
    background: #fff; border-radius: 22px 22px 0 0;
    width: 100%; max-width: 540px;
    max-height: 92vh; overflow-y: auto;
    animation: modalIn 0.3s cubic-bezier(.34,1.3,.64,1);
    position: relative;
  }
  @media (min-width: 600px) { .modal { border-radius: 22px; } }
  @keyframes modalIn { from { transform: translateY(40px); opacity: 0; } }

  .modal-close {
    position: absolute; top: 16px; right: 16px; z-index: 2;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(26,18,8,0.08); border: none; cursor: pointer;
    font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
    transition: background var(--trans);
  }
  .modal-close:hover { background: rgba(26,18,8,0.14); }

  /* ── BOOK DETAIL MODAL ── */
  .book-modal-cover {
    width: 100%; height: 260px; object-fit: cover;
    border-radius: 22px 22px 0 0;
    display: block;
  }
  .book-modal-cover-placeholder {
    width: 100%; height: 260px; background: var(--cream2);
    display: flex; align-items: center; justify-content: center;
    font-size: 5rem; border-radius: 22px 22px 0 0;
  }
  .book-modal-body { padding: 24px; }
  .book-modal-cat {
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--gold); margin-bottom: 8px;
  }
  .book-modal-title {
    font-family: var(--font-h); font-size: 1.7rem;
    color: var(--ink); margin-bottom: 6px; line-height: 1.2;
  }
  .book-modal-author { color: var(--ink3); margin-bottom: 16px; }
  .book-modal-desc { color: var(--ink2); font-size: 0.92rem; line-height: 1.7; margin-bottom: 20px; }
  .book-modal-meta {
    display: flex; gap: 20px; margin-bottom: 20px;
    padding: 14px 16px; background: var(--cream2); border-radius: 10px;
  }
  .meta-item { text-align: center; }
  .meta-val { font-weight: 600; font-size: 1rem; color: var(--ink); }
  .meta-lbl { font-size: 0.72rem; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.05em; }
  .book-modal-price {
    font-family: var(--font-h); font-size: 2rem;
    color: var(--gold); margin-bottom: 16px;
  }

  /* ── PAYMENT MODAL ── */
  .pay-header {
    background: var(--ink); color: #fff;
    padding: 28px 24px 24px;
    border-radius: 22px 22px 0 0;
    text-align: center;
  }
  @media (min-width: 600px) { .pay-header { border-radius: 22px 22px 0 0; } }
  .pay-header h2 { font-family: var(--font-h); font-size: 1.5rem; margin-bottom: 6px; }
  .pay-header p { color: rgba(255,255,255,0.65); font-size: 0.9rem; }
  .pay-body { padding: 24px; }

  .pay-step {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 16px; border-radius: 12px; background: var(--cream2);
    margin-bottom: 12px;
  }
  .pay-step-num {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--gold); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
  }
  .pay-step-content h4 { font-size: 0.9rem; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
  .pay-step-content p { font-size: 0.82rem; color: var(--ink3); line-height: 1.5; }
  .pay-number {
    display: inline-block; font-family: monospace; font-size: 1.1rem;
    background: #fff; padding: 4px 12px; border-radius: 6px;
    border: 1.5px solid rgba(200,146,42,0.3); color: var(--ink);
    font-weight: 700; letter-spacing: 0.05em; margin-top: 6px;
  }

  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--ink2); margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; padding: 12px 16px;
    border: 1.5px solid rgba(26,18,8,0.12);
    border-radius: 10px; background: #fff;
    font-family: var(--font-b); font-size: 0.9rem; color: var(--ink);
    transition: border-color var(--trans); outline: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); }
  .form-textarea { resize: vertical; min-height: 80px; }

  .pay-total {
    background: var(--ink); color: #fff;
    border-radius: 12px; padding: 16px 20px;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }
  .pay-total-label { font-size: 0.85rem; color: rgba(255,255,255,0.65); }
  .pay-total-amount { font-family: var(--font-h); font-size: 1.5rem; color: var(--gold2); }

  .pay-success {
    text-align: center; padding: 32px 24px;
  }
  .pay-success-icon {
    width: 70px; height: 70px; border-radius: 50%;
    background: rgba(45,106,79,0.12); border: 2px solid var(--sage);
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; margin: 0 auto 20px;
    animation: successPop 0.5s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes successPop { from { transform: scale(0); } }
  .pay-success h3 { font-family: var(--font-h); font-size: 1.5rem; color: var(--ink); margin-bottom: 10px; }
  .pay-success p { color: var(--ink3); font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px; }

  /* ── DOWNLOAD SECTION ── */
  .download-banner {
    background: linear-gradient(135deg, var(--sage), #1a4a35);
    color: #fff; border-radius: 12px;
    padding: 20px 24px;
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 12px;
  }
  .download-icon { font-size: 2rem; flex-shrink: 0; }
  .download-text h4 { font-weight: 600; margin-bottom: 4px; }
  .download-text p { font-size: 0.8rem; opacity: 0.8; }
  .btn-download {
    padding: 10px 22px; border-radius: 100px;
    background: rgba(255,255,255,0.15);
    border: 1.5px solid rgba(255,255,255,0.3);
    color: #fff; font-family: var(--font-b); font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all var(--trans); white-space: nowrap;
  }
  .btn-download:hover { background: rgba(255,255,255,0.25); }

  /* ── ADMIN PANEL ── */
  .admin-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 150;
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--ink); color: rgba(255,255,255,0.5);
    border: none; cursor: pointer; font-size: 1.3rem;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(26,18,8,0.3);
    transition: all var(--trans);
  }
  .admin-fab:hover { background: var(--ink2); color: rgba(255,255,255,0.8); transform: scale(1.05); }

  .admin-panel {
    width: 100%; max-width: 680px;
    border-radius: 22px 22px 0 0;
    max-height: 90vh; overflow-y: auto;
    background: #fff;
  }
  @media (min-width: 700px) { .admin-panel { border-radius: 22px; } }

  .admin-header {
    background: var(--ink); padding: 24px;
    border-radius: 22px 22px 0 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .admin-header h2 { font-family: var(--font-h); font-size: 1.4rem; color: #fff; }
  .admin-header p { font-size: 0.8rem; color: rgba(255,255,255,0.55); margin-top: 3px; }
  .admin-body { padding: 20px; }

  .admin-tabs {
    display: flex; gap: 6px; margin-bottom: 20px;
    background: var(--cream2); padding: 4px; border-radius: 12px;
  }
  .admin-tab {
    flex: 1; padding: 9px; border-radius: 9px;
    border: none; cursor: pointer; font-family: var(--font-b);
    font-size: 0.82rem; font-weight: 500; color: var(--ink3);
    background: transparent; transition: all var(--trans);
  }
  .admin-tab.active { background: #fff; color: var(--ink); box-shadow: 0 1px 6px var(--shadow); }

  .order-card {
    background: var(--cream2); border-radius: 12px;
    padding: 16px; margin-bottom: 10px;
  }
  .order-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .order-title { font-weight: 600; font-size: 0.9rem; color: var(--ink); }
  .order-customer { font-size: 0.8rem; color: var(--ink3); margin-top: 2px; }
  .order-amount { font-weight: 700; font-size: 0.95rem; color: var(--gold); }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 100px;
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .badge-pending { background: rgba(200,146,42,0.12); color: #8a5f10; }
  .badge-confirmed { background: rgba(45,106,79,0.12); color: var(--sage); }
  .badge-rejected { background: rgba(196,83,42,0.12); color: var(--terra); }

  .order-actions { display: flex; gap: 8px; margin-top: 12px; }
  .btn-confirm { background: rgba(45,106,79,0.1); color: var(--sage); border: 1.5px solid var(--sage); padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; font-family: var(--font-b); transition: all var(--trans); }
  .btn-confirm:hover { background: var(--sage); color: #fff; }
  .btn-reject { background: rgba(196,83,42,0.1); color: var(--terra); border: 1.5px solid var(--terra); padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; font-family: var(--font-b); transition: all var(--trans); }
  .btn-reject:hover { background: var(--terra); color: #fff; }

  .add-book-form { display: flex; flex-direction: column; gap: 14px; }

  /* ── TOAST ── */
  .toast-container { position: fixed; bottom: 90px; right: 24px; z-index: 500; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    background: var(--ink); color: #fff;
    padding: 12px 20px; border-radius: 12px;
    font-size: 0.85rem; font-weight: 500;
    box-shadow: 0 4px 20px rgba(26,18,8,0.25);
    animation: toastIn 0.3s cubic-bezier(.34,1.2,.64,1), toastOut 0.3s 3s ease forwards;
    display: flex; align-items: center; gap: 8px; max-width: 300px;
  }
  .toast-success { border-left: 3px solid var(--sage); }
  .toast-error { border-left: 3px solid var(--terra); }
  @keyframes toastIn { from { transform: translateX(20px); opacity: 0; } }
  @keyframes toastOut { to { transform: translateX(20px); opacity: 0; } }

  /* ── EMPTY STATE ── */
  .empty-state { text-align: center; padding: 60px 24px; color: var(--ink3); }
  .empty-state-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; }
  .empty-state h3 { font-family: var(--font-h); font-size: 1.3rem; color: var(--ink2); margin-bottom: 8px; }

  /* ── FOOTER ── */
  footer {
    background: var(--ink); color: rgba(255,255,255,0.55);
    text-align: center; padding: 32px 24px;
    font-size: 0.82rem;
  }
  footer strong { color: rgba(255,255,255,0.9); }

  /* ── RESPONSIVE ── */
  @media (max-width: 480px) {
    .hero-stats { gap: 20px; }
    .controls { gap: 8px; }
    .book-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .admin-fab { bottom: 16px; right: 16px; }
  }
`;

// ─── 5. UTILITAIRES ─────────────────────────────────────────
function formatPrice(amount, currency = "GNF") {
  return `${amount.toLocaleString("fr-GN")} ${currency}`;
}

function generateOrderRef() {
  return "YO-" + Date.now().toString(36).toUpperCase();
}

// ─── 6. HOOKS ────────────────────────────────────────────────

// Hook : chargement paginé des livres depuis Firestore
function useBooks(category) {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(true);
  const [lastDoc, setLastDoc]   = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setBooks([]);
    setLastDoc(null);
    setHasMore(true);
    try {
      const colRef = collection(db, "books");
      const constraints = [orderBy("createdAt", "desc"), limit(PAGE_SIZE)];
      if (category && category !== "Tous") {
        constraints.unshift(where("category", "==", category));
      }
      const snap = await getDocs(query(colRef, ...constraints));
      if (snap.empty && books.length === 0) {
        // Firebase non configuré → démo
        setUsingDemo(true);
        const filtered = category && category !== "Tous"
          ? DEMO_BOOKS.filter(b => b.category === category)
          : DEMO_BOOKS;
        setBooks(filtered);
        setHasMore(false);
      } else {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBooks(data);
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === PAGE_SIZE);
        setUsingDemo(false);
      }
    } catch {
      // Fallback démo si Firebase non configuré
      setUsingDemo(true);
      const filtered = category && category !== "Tous"
        ? DEMO_BOOKS.filter(b => b.category === category)
        : DEMO_BOOKS;
      setBooks(filtered);
      setHasMore(false);
    }
    setLoading(false);
  }, [category]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || usingDemo || !lastDoc) return;
    setLoading(true);
    try {
      const colRef = collection(db, "books");
      const constraints = [orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE)];
      if (category && category !== "Tous") {
        constraints.unshift(where("category", "==", category));
      }
      const snap = await getDocs(query(colRef, ...constraints));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBooks(prev => [...prev, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [hasMore, loading, usingDemo, lastDoc, category]);

  useEffect(() => { loadInitial(); }, [loadInitial]);
  return { books, loading, hasMore, loadMore, usingDemo };
}

// Hook : commandes temps réel (admin)
function useOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      return onSnapshot(q, snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } catch { return () => {}; }
  }, []);
  return orders;
}

// ─── 7. COMPOSANTS ──────────────────────────────────────────

// Toast Notifications
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" ? "✓" : "✕"} {t.message}
        </div>
      ))}
    </div>
  );
}

// Splash Screen
function SplashScreen({ visible }) {
  return (
    <div className={`splash${visible ? "" : " hidden"}`}>
      <div className="splash-logo">Y</div>
      <h1 className="splash-title">Librairie YO</h1>
      <p className="splash-slogan">Le savoir, à portée de main</p>
      <div className="splash-bar"><div className="splash-progress" /></div>
    </div>
  );
}

// Couverture avec lazy loading natif
function BookCover({ src, alt, className }) {
  if (!src) return <div className={className + "-placeholder"}>📚</div>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={e => { e.target.style.display = "none"; e.target.nextSibling?.style?.setProperty("display", "flex"); }}
    />
  );
}

// Carte livre
function BookCard({ book, onBuy, onDetail, delay = 0 }) {
  return (
    <div
      className="book-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onDetail(book)}
    >
      <BookCover src={book.coverUrl} alt={book.title} className="book-cover" />
      <div style={{ display: "none" }} className="book-cover-placeholder">📚</div>
      <div className="book-info">
        <div className="book-category">{book.category || "Livre"}</div>
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
        <div className="book-footer">
          <span className="book-price">{formatPrice(book.price, book.currency)}</span>
          <button
            className="book-buy"
            onClick={e => { e.stopPropagation(); onBuy(book); }}
          >
            Acheter
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal détail livre
function BookDetailModal({ book, onClose, onBuy }) {
  if (!book) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <BookCover src={book.coverUrl} alt={book.title} className="book-modal-cover" />
        <div className="book-modal-body">
          <div className="book-modal-cat">{book.category}</div>
          <h2 className="book-modal-title">{book.title}</h2>
          <p className="book-modal-author">par <strong>{book.author}</strong></p>
          <p className="book-modal-desc">{book.description || "Aucune description disponible."}</p>
          {(book.pages || book.year) && (
            <div className="book-modal-meta">
              {book.pages && <div className="meta-item"><div className="meta-val">{book.pages}</div><div className="meta-lbl">Pages</div></div>}
              {book.year && <div className="meta-item"><div className="meta-val">{book.year}</div><div className="meta-lbl">Année</div></div>}
              <div className="meta-item"><div className="meta-val">PDF</div><div className="meta-lbl">Format</div></div>
            </div>
          )}
          <div className="book-modal-price">{formatPrice(book.price, book.currency)}</div>
          <button className="btn btn-primary btn-full" onClick={() => onBuy(book)}>
            🛒 Acheter maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal paiement Orange Money
function PaymentModal({ book, onClose, onSuccess }) {
  const [step, setStep] = useState("instructions"); // instructions | form | success
  const [form, setForm] = useState({ name: "", phone: "", txRef: "" });
  const [submitting, setSubmitting] = useState(false);
  const orderRef = useMemo(() => generateOrderRef(), []);

  if (!book) return null;

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "orders"), {
        orderRef,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        amount: book.price,
        currency: book.currency || "GNF",
        customerName: form.name,
        customerPhone: form.phone,
        txRef: form.txRef,
        status: "pending", // pending | confirmed | rejected
        downloadUrl: null,  // ← URL PDF générée par l'admin après validation
        createdAt: serverTimestamp(),
      });
      setStep("success");
      onSuccess?.();
    } catch {
      // Mode démo : simule la commande
      setStep("success");
    }
    setSubmitting(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {step === "instructions" && (
          <>
            <div className="pay-header">
              <h2>💳 Paiement Orange Money</h2>
              <p>« {book.title} » — {formatPrice(book.price, book.currency)}</p>
            </div>
            <div className="pay-body">
              <div className="pay-step">
                <div className="pay-step-num">1</div>
                <div className="pay-step-content">
                  <h4>Effectuer le transfert Orange Money</h4>
                  <p>Envoyez exactement <strong>{formatPrice(book.price, book.currency)}</strong> au numéro :</p>
                  <span className="pay-number">📱 {ORANGE_MONEY_NR}</span>
                  <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--terra)" }}>
                    Notez la <strong>référence de transaction</strong> affichée après le transfert.
                  </p>
                </div>
              </div>
              <div className="pay-step">
                <div className="pay-step-num">2</div>
                <div className="pay-step-content">
                  <h4>Remplir le formulaire de confirmation</h4>
                  <p>Indiquez vos coordonnées et la référence Orange Money.</p>
                </div>
              </div>
              <div className="pay-step">
                <div className="pay-step-num">3</div>
                <div className="pay-step-content">
                  <h4>Recevoir votre livre</h4>
                  <p>Après validation (quelques heures), vous recevrez un lien de téléchargement sécurisé.</p>
                </div>
              </div>
              <button className="btn btn-terra btn-full" style={{ marginTop: 8 }} onClick={() => setStep("form")}>
                J'ai effectué le transfert →
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <div className="pay-header">
              <h2>📋 Confirmation de paiement</h2>
              <p>Référence commande : <strong>{orderRef}</strong></p>
            </div>
            <div className="pay-body">
              <div className="form-group">
                <label className="form-label">Votre nom complet *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex : Mamadou Bah"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Votre numéro Orange Money *</label>
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Ex : 224 6xx xxx xxx"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Référence de transaction Orange Money</label>
                <input
                  className="form-input"
                  value={form.txRef}
                  onChange={e => setForm(f => ({ ...f, txRef: e.target.value }))}
                  placeholder="Ex : MP240312xxxx"
                />
              </div>
              <div className="pay-total">
                <div>
                  <div className="pay-total-label">Total à payer</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{book.title}</div>
                </div>
                <div className="pay-total-amount">{formatPrice(book.price, book.currency)}</div>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Envoi en cours…" : "✓ Confirmer ma commande"}
              </button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setStep("instructions")}>
                ← Retour
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="pay-success">
            <div className="pay-success-icon">✓</div>
            <h3>Commande enregistrée !</h3>
            <p>
              Votre commande <strong>{orderRef}</strong> a bien été reçue.<br />
              Notre équipe va vérifier votre paiement et vous envoyer le lien de téléchargement
              dans les <strong>24 heures</strong>.<br /><br />
              Conservez votre numéro de commande.
            </p>
            <div style={{ background: "var(--cream2)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "0.05em", color: "var(--ink)", fontWeight: 700 }}>
              {orderRef}
            </div>
            <button className="btn btn-primary btn-full" onClick={onClose}>Retour aux livres</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel Admin
function AdminPanel({ onClose, addToast }) {
  const [authed, setAuthed]     = useState(false);
  const [pwInput, setPwInput]   = useState("");
  const [tab, setTab]           = useState("orders");
  const [newBook, setNewBook]   = useState({ title: "", author: "", price: "", currency: "GNF", category: "Roman", description: "", coverUrl: "", pages: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const orders = useOrders();

  const login = () => {
    if (pwInput === ADMIN_PASSWORD) setAuthed(true);
    else addToast("Mot de passe incorrect", "error");
  };

  // Valider une commande → génère l'URL de téléchargement Firebase Storage
  const confirmOrder = async (order) => {
    try {
      // ⚠️ L'URL du PDF est générée ICI côté admin uniquement
      // Assure-toi que le fichier PDF est dans Storage à : books/{bookId}.pdf
      const pdfRef = storageRef(storage, `books/${order.bookId}.pdf`);
      const downloadUrl = await getDownloadURL(pdfRef);
      await updateDoc(doc(db, "orders", order.id), {
        status: "confirmed",
        downloadUrl, // ← Sécurisé : lien temporaire Firebase signé
        confirmedAt: serverTimestamp(),
      });
      addToast(`Commande ${order.orderRef} confirmée ✓`, "success");
    } catch (e) {
      // Si le PDF n'est pas encore uploadé, on confirme sans URL
      await updateDoc(doc(db, "orders", order.id), { status: "confirmed", confirmedAt: serverTimestamp() });
      addToast("Confirmé (PDF non encore uploadé)", "success");
    }
  };

  const rejectOrder = async (order) => {
    await updateDoc(doc(db, "orders", order.id), { status: "rejected" });
    addToast(`Commande ${order.orderRef} rejetée`, "error");
  };

  // Ajouter un livre (sans fichier PDF — PDF uploadé séparément dans Firebase Storage)
  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.price) {
      addToast("Titre, auteur et prix sont obligatoires", "error");
      return;
    }
    setUploading(true);
    try {
      await addDoc(collection(db, "books"), {
        ...newBook,
        price: parseInt(newBook.price),
        pages: parseInt(newBook.pages) || 0,
        createdAt: serverTimestamp(),
        visible: true,
      });
      addToast(`« ${newBook.title} » ajouté au catalogue ✓`, "success");
      setNewBook({ title: "", author: "", price: "", currency: "GNF", category: "Roman", description: "", coverUrl: "", pages: "" });
    } catch (e) {
      addToast("Erreur Firebase : " + e.message, "error");
    }
    setUploading(false);
  };

  const pending   = orders.filter(o => o.status === "pending");
  const confirmed = orders.filter(o => o.status === "confirmed");
  const rejected  = orders.filter(o => o.status === "rejected");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>

        {!authed ? (
          <>
            <div className="admin-header">
              <div>
                <h2>🔐 Administration</h2>
                <p>Librairie YO — Espace sécurisé</p>
              </div>
              <button className="modal-close" style={{ position: "static", background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={onClose}>✕</button>
            </div>
            <div className="admin-body">
              <div className="form-group">
                <label className="form-label">Mot de passe administrateur</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwInput}
                  onChange={e => setPwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && login()}
                  placeholder="••••••••••"
                  autoFocus
                />
              </div>
              <button className="btn btn-primary btn-full" onClick={login}>Accéder →</button>
            </div>
          </>
        ) : (
          <>
            <div className="admin-header">
              <div>
                <h2>⚡ Administration</h2>
                <p>{pending.length} commande{pending.length > 1 ? "s" : ""} en attente</p>
              </div>
              <button className="modal-close" style={{ position: "static", background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={onClose}>✕</button>
            </div>
            <div className="admin-body">
              <div className="admin-tabs">
                <button className={`admin-tab${tab === "orders" ? " active" : ""}`} onClick={() => setTab("orders")}>
                  Commandes {pending.length > 0 && `(${pending.length})`}
                </button>
                <button className={`admin-tab${tab === "confirmed" ? " active" : ""}`} onClick={() => setTab("confirmed")}>Confirmées</button>
                <button className={`admin-tab${tab === "add" ? " active" : ""}`} onClick={() => setTab("add")}>+ Ajouter</button>
              </div>

              {tab === "orders" && (
                <>
                  {pending.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">✓</div>
                      <h3>Aucune commande en attente</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--ink3)", marginTop: 8 }}>Toutes les commandes ont été traitées.</p>
                    </div>
                  )}
                  {pending.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <div className="order-title">{order.bookTitle}</div>
                          <div className="order-customer">👤 {order.customerName} · 📱 {order.customerPhone}</div>
                          {order.txRef && <div className="order-customer">Réf OM : {order.txRef}</div>}
                          <div className="order-customer" style={{ marginTop: 4 }}>🔖 {order.orderRef}</div>
                        </div>
                        <div>
                          <div className="order-amount">{formatPrice(order.amount, order.currency)}</div>
                          <span className="badge badge-pending">En attente</span>
                        </div>
                      </div>
                      <div className="order-actions">
                        <button className="btn-confirm" onClick={() => confirmOrder(order)}>✓ Confirmer + PDF</button>
                        <button className="btn-reject" onClick={() => rejectOrder(order)}>✕ Rejeter</button>
                      </div>
                    </div>
                  ))}
                  {rejected.length > 0 && (
                    <>
                      <div style={{ margin: "16px 0 8px", fontSize: "0.8rem", color: "var(--ink3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rejetées</div>
                      {rejected.slice(0, 3).map(order => (
                        <div key={order.id} className="order-card" style={{ opacity: 0.6 }}>
                          <div className="order-card-header">
                            <div>
                              <div className="order-title">{order.bookTitle}</div>
                              <div className="order-customer">{order.customerName}</div>
                            </div>
                            <span className="badge badge-rejected">Rejetée</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {tab === "confirmed" && (
                <>
                  {confirmed.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3>Aucune commande confirmée</h3>
                    </div>
                  ) : confirmed.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <div className="order-title">{order.bookTitle}</div>
                          <div className="order-customer">{order.customerName} · {order.customerPhone}</div>
                          <div className="order-customer">🔖 {order.orderRef}</div>
                        </div>
                        <div>
                          <div className="order-amount">{formatPrice(order.amount, order.currency)}</div>
                          <span className="badge badge-confirmed">Confirmée</span>
                        </div>
                      </div>
                      {order.downloadUrl && (
                        <a href={order.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginTop: 8, background: "rgba(45,106,79,0.1)", color: "var(--sage)", textDecoration: "none" }}>
                          📥 Lien PDF
                        </a>
                      )}
                    </div>
                  ))}
                </>
              )}

              {tab === "add" && (
                <div className="add-book-form">
                  <p style={{ fontSize: "0.82rem", color: "var(--ink3)", background: "var(--cream2)", padding: "12px 14px", borderRadius: 10, lineHeight: 1.6 }}>
                    📌 <strong>Rappel sécurité :</strong> Uploadez le fichier PDF directement dans <strong>Firebase Storage</strong> sous le chemin <code>books/{"{bookId}"}.pdf</code> après avoir noté l'ID généré.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Titre *</label>
                    <input className="form-input" value={newBook.title} onChange={e => setNewBook(b => ({ ...b, title: e.target.value }))} placeholder="Titre du livre" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auteur *</label>
                    <input className="form-input" value={newBook.author} onChange={e => setNewBook(b => ({ ...b, author: e.target.value }))} placeholder="Nom de l'auteur" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Prix *</label>
                      <input className="form-input" type="number" value={newBook.price} onChange={e => setNewBook(b => ({ ...b, price: e.target.value }))} placeholder="15000" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Devise</label>
                      <select className="form-select" value={newBook.currency} onChange={e => setNewBook(b => ({ ...b, currency: e.target.value }))}>
                        <option>GNF</option><option>USD</option><option>EUR</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Catégorie</label>
                    <select className="form-select" value={newBook.category} onChange={e => setNewBook(b => ({ ...b, category: e.target.value }))}>
                      {["Roman","Éducation","Contes","Business","Poésie","Histoire","Cuisine","Santé","Autre"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL de la couverture</label>
                    <input className="form-input" value={newBook.coverUrl} onChange={e => setNewBook(b => ({ ...b, coverUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={newBook.description} onChange={e => setNewBook(b => ({ ...b, description: e.target.value }))} placeholder="Description du livre…" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre de pages</label>
                    <input className="form-input" type="number" value={newBook.pages} onChange={e => setNewBook(b => ({ ...b, pages: e.target.value }))} placeholder="250" />
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleAddBook} disabled={uploading}>
                    {uploading ? "Ajout en cours…" : "✓ Ajouter au catalogue"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 8. APP PRINCIPAL ────────────────────────────────────────
export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [category, setCategory]           = useState("Tous");
  const [search, setSearch]               = useState("");
  const [selectedBook, setSelectedBook]   = useState(null);
  const [buyBook, setBuyBook]             = useState(null);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [toasts, setToasts]               = useState([]);
  const sentinelRef                       = useRef(null);

  const { books, loading, hasMore, loadMore, usingDemo } = useBooks(category);

  // Auth anonyme Firebase (pour les règles Firestore)
  useEffect(() => {
    signInAnonymously(auth).catch(() => {});
  }, []);

  // Masquer le splash après 2s
  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  // Infinite scroll avec IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const categories = ["Tous", "Roman", "Éducation", "Business", "Histoire", "Contes", "Poésie", "Cuisine", "Santé"];

  // Filtrage local par recherche
  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    );
  }, [books, search]);

  const bookCount = usingDemo ? DEMO_BOOKS.length : filteredBooks.length;

  return (
    <>
      <style>{CSS}</style>

      <SplashScreen visible={splashVisible} />

      {/* HEADER */}
      <header>
        <div className="header-brand" onClick={() => setCategory("Tous")}>
          <div className="header-logo">Y</div>
          <span className="header-name">Librairie YO</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" style={{ display: "none" }}>Mon compte</button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-tag">📚 Librairie Numérique — Conakry</div>
        <h1>Le savoir africain,<br /><em>en un clic</em></h1>
        <p>Achetez et téléchargez vos livres immédiatement. Paiement simple par Orange Money.</p>
        <button className="btn btn-primary" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>
          Explorer le catalogue →
        </button>
        <div className="hero-stats">
          <div><div className="stat-num">{bookCount}+</div><div className="stat-lbl">Livres</div></div>
          <div><div className="stat-num">100%</div><div className="stat-lbl">Numérique</div></div>
          <div><div className="stat-num">24h</div><div className="stat-lbl">Livraison</div></div>
        </div>
      </section>

      {/* MODE DÉMO */}
      {usingDemo && (
        <div style={{ background: "rgba(200,146,42,0.08)", border: "1px solid rgba(200,146,42,0.2)", margin: "20px 24px 0", borderRadius: 12, padding: "12px 16px", fontSize: "0.82rem", color: "var(--ink2)", textAlign: "center" }}>
          ⚙️ <strong>Mode démonstration</strong> — Configure Firebase dans <code>src/App.jsx</code> pour afficher vos vrais livres.
        </div>
      )}

      {/* CATALOGUE */}
      <div id="catalogue">
        {/* Recherche + Filtres */}
        <div className="controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un livre, auteur…"
            />
          </div>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn${category === cat ? " active" : ""}`}
              onClick={() => { setCategory(cat); setSearch(""); }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille de livres */}
        <div className="books-section">
          <h2 className="section-title">
            {category === "Tous" ? "Tous les livres" : category}
            {filteredBooks.length > 0 && <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--ink3)", fontFamily: "var(--font-b)" }}>({filteredBooks.length})</span>}
          </h2>

          {filteredBooks.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>Aucun livre trouvé</h3>
              <p style={{ fontSize: "0.85rem", marginTop: 8, color: "var(--ink3)" }}>Essayez un autre terme de recherche.</p>
            </div>
          ) : (
            <div className="book-grid">
              {filteredBooks.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  delay={(i % PAGE_SIZE) * 40}
                  onBuy={setBuyBook}
                  onDetail={setSelectedBook}
                />
              ))}
            </div>
          )}

          {/* Sentinel pour infinite scroll */}
          <div ref={sentinelRef} className="sentinel" />
          {loading && (
            <div className="loading-more">
              <div className="spinner" />
              Chargement…
            </div>
          )}
          {!hasMore && !loading && filteredBooks.length > 0 && (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--ink3)", fontSize: "0.82rem" }}>
              ── Fin du catalogue ──
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <p><strong>Librairie YO</strong> — Conakry, Guinée</p>
        <p style={{ marginTop: 6 }}>Orange Money : {ORANGE_MONEY_NR} · Livraison numérique sous 24h</p>
      </footer>

      {/* MODALS */}
      {selectedBook && !buyBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onBuy={book => { setSelectedBook(null); setBuyBook(book); }}
        />
      )}

      {buyBook && (
        <PaymentModal
          book={buyBook}
          onClose={() => setBuyBook(null)}
          onSuccess={() => addToast("Commande reçue ! Vérification en cours…", "success")}
        />
      )}

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          addToast={addToast}
        />
      )}

      {/* FAB ADMIN (discret) */}
      <button className="admin-fab" onClick={() => setShowAdmin(true)} title="Administration">
        ⚙
      </button>

      <ToastContainer toasts={toasts} />
    </>
  );
}
