"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="container section"><h1>Матеріали тимчасово недоступні</h1><button className="button gold" onClick={()=>reset()}>Спробувати ще раз</button></main>}
