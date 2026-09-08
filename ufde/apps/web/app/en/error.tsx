"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="container section"><h1>Content temporarily unavailable</h1><button className="button gold" onClick={()=>reset()}>Try again</button></main>}
