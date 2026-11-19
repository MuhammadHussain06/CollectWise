import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>CollectWise</h1>
      <p>Desa Mentari, Block 2</p>
      <ul>
        <li>
          <Link href="/checkin">Collector check-in</Link>
        </li>
        <li>
          <Link href="/dashboard">JMB dashboard</Link>
        </li>
      </ul>
    </main>
  );
}
