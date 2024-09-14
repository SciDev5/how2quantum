"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { gen_hamiltonian, solve_schrodinger } from "./qm";
import { GL2Canvas } from "./render_generic";

export default function Home() {
  const [s, set_s] = useState(false)

  useEffect(() => {
    set_s(true)
  }, [])

  return (
    <div className={styles.page}>
      <GL2Canvas>
        <></>
      </GL2Canvas>
      {s && <The />}
    </div>
  );
}

function The() {
  const U_diag = [...new Array(20).fill(0), ...new Array(20).fill(-10), ...new Array(20).fill(0)]
  const H = gen_hamiltonian(U_diag, { dx: 0.1, m: 1.0, hbar: 1.0 })
  const psi_basis = solve_schrodinger(H)

  const psi = psi_basis[2].v

  return (
    <div style={{ display: "flex" }}>

      {psi.map((v, i) => (
        <div key={i} style={{ flex: "1 1", height: `${-v.toPolar().r * 100 + 100}px`, background: "#ff00ff" }}></div>
      ))}
    </div>
  )
}