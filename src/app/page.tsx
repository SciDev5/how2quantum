"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { decomposition, gen_hamiltonian, solve_schrodinger, superposition } from "./qm";
import { GL2Canvas, useGLX, XShader, XBuffer } from "./render_generic";
import { Canvas2D, useC2D as useC2D } from "./render_2d";
import * as M from "mathjs"

export default function Home() {
  const [s, set_s] = useState(false)

  useEffect(() => {
    set_s(true)
  }, [])

  return (
    <div className={styles.page}>
      {s && <The />}
    </div>
  );
}

function The() {
  const z = performance.now()


  const U_diag = [...new Array(60).fill(0), ...new Array(20).fill(-50), ...new Array(60).fill(0)]
  const H = gen_hamiltonian(U_diag, { dx: 0.1, m: 1.0, hbar: 1.0 })
  const psi_basis = solve_schrodinger(H)


  console.log("eigs", performance.now() - z);

  const r = performance.now()

  const decomp = decomposition(psi_basis.slice(0, psi_basis[0].v.length), psi_basis[0].v.map((_, i) => M.complex(Math.sqrt(Math.max(0, 0.01 - Math.abs(i / psi_basis[0].v.length - 0.5))), 0)))
  // const decomp = decomposition(psi_basis.slice(0, 100), psi_basis[0].v.map((_, i) => M.complex(Math.sqrt(i), 0)))
  console.log(decomp);


  // const psi = superposition(psi_basis, decomp)

  console.log("decomp/superpos", performance.now() - r);

  return (
    <div style={{ display: "flex" }}>
      <Canvas2D>
        <TimeEvolver decomp_t0={decomp} psi_basis={psi_basis} time_scale={0.1} potential_diag={U_diag} />
      </Canvas2D>
    </div>
  )
}

function TimeEvolver({ decomp_t0, psi_basis, time_scale, potential_diag }: {
  decomp_t0: M.Complex[],
  psi_basis: {
    l: number;
    v: M.Complex[];
  }[],
  time_scale: number,
  potential_diag: number[]
}) {
  const state = useMemo(() => ({ t_0: 0 }), [])
  const [current_psi, set_current_psi] = useState(psi_basis[0].v)
  useEffect(() => {
    state.t_0 = Date.now() / 1000
    const id = setInterval(() => {
      const t = Date.now() / 1000 - state.t_0
      const current_decomp = decomp_t0.map((c, i) => M.multiply(c, M.complex({ phi: -psi_basis[i].l * t * time_scale, r: 1 })) as M.Complex)
      set_current_psi(superposition(psi_basis, current_decomp))
    })
    return () => { clearInterval(id) }
  }, [decomp_t0, psi_basis, time_scale])
  return <DrawWavefunction wavefn={current_psi} potential_diag={potential_diag} />
}

function DrawWavefunction({ wavefn, potential_diag }: { wavefn: M.Complex[], potential_diag: number[] }) {
  const c2d = useC2D()

  useEffect(() => {
    c2d.clear()

    // c2d.line("#444444", [0, c2d.height / 2], [c2d.width, c2d.height / 2])
    const v_max = Math.max(...potential_diag.map(Math.abs))
    c2d.line("#777777", ...potential_diag.map((v, i) => [c2d.width * i / (potential_diag.length - 1), c2d.height / 2 * (1 - v / v_max)] satisfies [number, number]))
    // c2d.line("#ff0000", ...wavefn.map((z, i) => {
    //   return [i / (wavefn.length - 1) * c2d.width, c2d.height * (0.5 - z.re)] satisfies [number, number]
    // }))
    // c2d.line("#0000ff", ...wavefn.map((z, i) => {
    //   return [i / (wavefn.length - 1) * c2d.width, c2d.height * (0.5 - z.im)] satisfies [number, number]
    // }))

    c2d.colored_line_path(wavefn.map((z, i) => {
      const { phi, r } = z.toPolar()

      return {
        color: `hsl(${phi}rad, 100%, 50%)`,
        pos: [i / (wavefn.length - 1) * c2d.width, c2d.height * (1 - 5 * r ** 2)]
      }
    }))
    // c2d.line("#ffffff", ...wavefn.map((z, i) => {
    //   const r2 = z.re ** 2 + z.im ** 2
    //   return [i / (wavefn.length - 1) * c2d.width, c2d.height * (1 - r2)] satisfies [number, number]
    // }))

  }, [wavefn])

  return <></>
}

// function The2() {
//   const glx = useGLX()

//   useEffect(() => {
//     const shader = new XShader(
//       glx,
//       `#version 300 es

// precision highp float;

// attribute float uv;
// uniform Tbuf {
//   float re;
//   float im;
// } tbuf[50];

// varying float uv_v;

// void main() {
//   // vec4 k = texture(tex, vec2(uv,0.0));
//   // vec2 k2 = vec2(
//   //   k.x*255.0/256.0 + k.y/256.0,
//   //   k.z*255.0/256.0 + k.w/256.0
//   // );
//   vec2 k = tbuf[int(uv * 50.0)];
//   gl_Position = vec4(uv*2.0-1.0, k.x, 0.0, 1.0);
//   // gl_PointSize = 64.0;
//   }
//   `,
//       `#version 100

// precision highp float;

// varying float uv_v;
// // uniform sampler2D uSampler;

// void main() {
//   gl_FragColor = vec4(0.18, 0.54, 0.34, 1.0);
// }
//     `,
//     )
//     const TBUF_I = 1
//     // shader.block_binding("tbuf", TBUF_I)

//     const buf = new XBuffer(glx, 1)
//     buf.write_array(new Array(100).fill(0).map((_, i) => i / 99))
//     // const tex = new XTexCx2D(glx, { w: 50, h: 1 })
//     // const tbuf = new XBuffer(glx, 2)
//     const x = new Array(100).fill(0).map(() => Math.random())

//     glx.clear(0.05, 0.05, 0.1)
//     buf.bind(shader.get_attrib_location("uv"))

//     shader.use()
//     // tbuf.bind(TBUF_I, true)
//     glx.gl.uniform2fv(shader.get_uniform_location("tbuf"), x)
//     // glx.gl.enableVertexAttribArray()
//     glx.draw_arrays_line_strip(shader, 0, buf.length)
//     // console.log(
//     //   glx.gl.getUniformIndices(shader.program, ["tbuf"])
//     //   // glx.gl.getActiveUniformBlockName(shader.program, 0)
//     // );

//     return () => {
//       shader.destroy()
//       buf.destroy()
//     }
//   })

//   return <></>
// }
