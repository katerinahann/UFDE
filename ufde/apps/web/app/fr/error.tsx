"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="container section"><h1>Contenu temporairement indisponible</h1><button className="button gold" onClick={()=>reset()}>Réessayer</button></main>}
