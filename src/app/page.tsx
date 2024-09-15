"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { decomposition, gen_hamiltonian, solve_schrodinger, superposition, time_evolve } from "./qm";
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

  const TIME_SCALE = 0.1

  const U_diag = useMemo(() => [...new Array(50).fill(0), ...new Array(20).fill(-50), ...new Array(50).fill(0)] as number[], [])

  const gen_psi_basis = () => {
    const _t_start_eigs = performance.now()
    const H = gen_hamiltonian(U_diag, { dx: 0.1, m: 1.0, hbar: 1.0 })
    const psi_basis = solve_schrodinger(H)
    console.log("t: eigendecomp", performance.now() - _t_start_eigs);
    return psi_basis
  }

  const [psi_basis, set_psi_basis] = useState(gen_psi_basis)

  const [decomp_t0, set_decomp_t0] = useState(() => {
    const _t_decomp = performance.now()
    const decomp_t0 = decomposition(psi_basis, psi_basis[0].v.map((_, i) => M.complex(Math.sqrt(Math.max(0, 0.02 - Math.abs(i / psi_basis[0].v.length - 0.5))), 0)))
    console.log("t: decomp/superpos", performance.now() - _t_decomp);
    return decomp_t0
  })

  const [t0, set_t0] = useState(() => Date.now() / 1000)
  const [te, set_te] = useState(() => Date.now() / 1000)

  const [editing, set_editing] = useState<null | "U" | "psi">(null)
  const [which_to_edit, set_which_to_edit] = useState<null | "U" | "psi">("U")

  const update_potential = useCallback(() => {
    const psi = superposition(psi_basis, time_evolve(psi_basis, decomp_t0, (te - t0) * TIME_SCALE))
    const psi_basis_new = gen_psi_basis()
    set_psi_basis(psi_basis_new)
    const decomp_t0_new = decomposition(psi_basis_new, psi)
    set_decomp_t0(decomp_t0_new)
    set_t0(Date.now() / 1000)
    set_editing(null)
    set_pure_state_i_str("")
  }, [U_diag, decomp_t0, t0, te])

  const update_wavefn = useCallback((psi: M.Complex[]) => {
    const decomp_t0_new = decomposition(psi_basis, psi)
    set_decomp_t0(decomp_t0_new)
    set_t0(Date.now() / 1000)
    set_editing(null)
    set_pure_state_i_str("")
  }, [psi_basis])

  const v_max = 50 //useMemo(() => Math.max(...U_diag.map(Math.abs)), [U_diag.toString()])

  const [pure_state_i_str, set_pure_state_i_str] = useState("0")

  const [show_helpmodal, set_show_helpmodal] = useState(false)
  const hide_helpmodal = useCallback(() => { set_show_helpmodal(false) }, [])

  return (
    <div className={styles.main} style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className={styles.header}>
        <div className={styles.header_name}>
          How2Quantum

          <button
            className={styles.erm_ackchually}
            onClick={() => set_show_helpmodal(true)}
          >wait actually how tho...</button>
          {show_helpmodal && <HelpModal on_escape={hide_helpmodal} />}
        </div>
        <div className={styles.header_edit}>
          <span>click and drag to edit </span>
          {/* <button onClick={() => set_which_to_edit(null)} disabled={which_to_edit === null}>none</button> */}
          <button onClick={() => {
            set_which_to_edit("psi")
            set_t0(Date.now())
          }} disabled={which_to_edit === "psi"}>wavefunction</button>
          <button onClick={() => {
            set_which_to_edit("U")
          }} disabled={which_to_edit === "U"}>potential</button>

          <span>select energy level</span>
          <input value={pure_state_i_str} onChange={e => {
            set_pure_state_i_str(e.currentTarget.value)
            const n = e.currentTarget.valueAsNumber
            if (!isFinite(n) || !Number.isInteger(n) || n >= psi_basis.length) return
            update_wavefn([...psi_basis[n].v])
            set_pure_state_i_str(e.currentTarget.value)
          }} type="number" min={0} max={psi_basis.length - 1} step={1} />
        </div>
      </div>
      <Canvas2D>
        <CanvasClickDetector on_mousedown={() => {
          set_editing(which_to_edit)
          set_te(Date.now() / 1000)
        }} />
        {
          editing == null
            ? <TimeEvolver decomp_t0={decomp_t0} t0={t0} psi_basis={psi_basis} time_scale={TIME_SCALE} potential_diag={U_diag} v_max={v_max} />
            : editing == "U"
              ? <PotentialEditor wavefn={superposition(psi_basis, time_evolve(psi_basis, decomp_t0, (te - t0) * TIME_SCALE))} potential_ref={U_diag} v_max={v_max} set_potential={update_potential} />
              : <WavefunctionEditor wavefn={psi_basis[0].v.map(() => M.complex(0, 0))} potential_ref={U_diag} v_max={v_max} set_wavefn={update_wavefn} />
        }
      </Canvas2D>
    </div>
  )
}

function HelpModal({ on_escape }: { on_escape: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current!.showModal()
  })
  return (<dialog
    className={styles.helpmodal}
    ref={ref}
    onClose={on_escape}
    onKeyDown={useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        on_escape()
      }
    }, [on_escape])}
    onClick={useCallback((e: React.MouseEvent) => {
      if (e.target === ref.current) {
        on_escape()
      }
    }, [on_escape])}
  >
    <div>
      <h1>How to Quantum Mechanics</h1>
      <p>
        {":: :: :: Quantum mechanics is mysterious, ...but what if it weren't? :: :: ::"}
      </p>
      <br />
      <h2>{"Interactive demos are the best way to understand how things work."}</h2>
      <p>
        {"To use this demo, click and drag on the page to edit the "}
        <b>potential energy</b> and the <b>wavefunction</b>.
        {"The buttons at the top of the screen allow you toswitch what you're editing, or select "}<b>energy eigenstates</b>.
      </p>
      <br />
      <h2>{"An eigen-what-now? Wave-funct-o-whatever?"}</h2>
      <p>
        TODO: Explain basic QM
      </p>
    </div>
  </dialog>)
}

function CanvasClickDetector({
  on_mousedown,
  on_mouseup,
}: {
  on_mousedown?: (e: MouseEvent) => void,
  on_mouseup?: (e: MouseEvent) => void,
}) {
  const cnv = useC2D().ctx.canvas

  const useEvent = function <K extends keyof HTMLElementEventMap>(
    event_name: K,
    event?: (ev: HTMLElementEventMap[K]) => void,
  ) {
    useEffect(() => {
      if (event == null) return
      cnv.addEventListener(event_name, event)
      return () => cnv.removeEventListener(event_name, event)
    }, [event])
  }
  useEvent("mousedown", on_mousedown)
  useEvent("mouseup", on_mouseup)

  return <></>
}

function PotentialEditor({ wavefn, potential_ref, set_potential, v_max }: { wavefn: M.Complex[], potential_ref: number[], set_potential: () => void, v_max: number }) {
  const c2d = useC2D()
  useEffect(() => {
    const ev = () => {
      set_potential()
    }
    addEventListener("mouseup", ev)
    return () => removeEventListener("mouseup", ev)
  }, [set_potential])

  const [update, set_update] = useState(0)

  const state = useMemo<{ prev?: { i: number, y: number } }>(() => ({}), [])

  useEffect(() => {
    const cb = (e: MouseEvent) => {
      const i = Math.floor(e.offsetX / c2d.width * potential_ref.length)
      const y = (1.0 - e.offsetY / c2d.height * 2.0) * v_max * 2.0

      if (state.prev != null) {
        const i_prev = state.prev.i
        const y_prev = state.prev.y

        if (i > i_prev) {
          for (let j = i_prev + 1; j < i; j++) {
            const k = (j - i_prev) / (i - i_prev + 1)
            potential_ref[j] = k * (y - y_prev) + y_prev
          }
        }
        if (i_prev > i) {
          for (let j = i + 1; j < i_prev; j++) {
            const k = (j - i) / (i_prev - i + 1)
            potential_ref[j] = k * (y_prev - y) + y
          }
        }
      }

      potential_ref[i] = y
      state.prev = { i, y }

      set_update(Math.random())
    }
    c2d.ctx.canvas.addEventListener("mousemove", cb)
    return () => c2d.ctx.canvas.removeEventListener("mousemove", cb)
  }, [potential_ref])

  return (<DrawStuff
    wavefn={wavefn}
    potential_diag={potential_ref}
    v_max={v_max}
    force_update={update}
  />)
}


function WavefunctionEditor({ wavefn, set_wavefn, potential_ref, v_max }: { wavefn: M.Complex[], potential_ref: number[], set_wavefn: (wavefn: M.Complex[]) => void, v_max: number }) {
  const c2d = useC2D()
  useEffect(() => {
    const ev = () => {
      set_wavefn(wavefn)
    }
    addEventListener("mouseup", ev)
    return () => removeEventListener("mouseup", ev)
  }, [set_wavefn, wavefn])

  const [update, set_update] = useState(0)

  const state = useMemo<{ prev?: { i: number, y: number } }>(() => ({}), [])

  useEffect(() => {
    const cb = (e: MouseEvent) => {
      const i = Math.floor(e.offsetX / c2d.width * wavefn.length)
      const y = (1.0 - e.offsetY / c2d.height * 2.0) * 0.5

      if (state.prev != null) {
        const i_prev = state.prev.i
        const y_prev = state.prev.y

        if (i > i_prev) {
          for (let j = i_prev + 1; j < i; j++) {
            const k = (j - i_prev) / (i - i_prev + 1)
            wavefn[j].re = k * (y - y_prev) + y_prev
          }
        }
        if (i_prev > i) {
          for (let j = i + 1; j < i_prev; j++) {
            const k = (j - i) / (i_prev - i + 1)
            wavefn[j].re = k * (y_prev - y) + y
          }
        }
      }

      wavefn[i].re = y
      state.prev = { i, y }

      set_update(Math.random())
    }
    c2d.ctx.canvas.addEventListener("mousemove", cb)
    return () => c2d.ctx.canvas.removeEventListener("mousemove", cb)
  }, [potential_ref])

  return (<DrawStuff
    wavefn={wavefn}
    show_split_wavefn
    potential_diag={potential_ref}
    v_max={v_max}
    force_update={update}
  />)
}

function TimeEvolver({ decomp_t0, t0, psi_basis, time_scale, potential_diag, v_max }: {
  decomp_t0: M.Complex[],
  psi_basis: {
    l: number;
    v: M.Complex[];
  }[],
  time_scale: number,
  t0: number,
  potential_diag: number[],
  v_max: number,
}) {
  const [current_psi, set_current_psi] = useState(psi_basis[0].v)
  useEffect(() => {
    const id = setInterval(() => {
      const t = (Date.now() / 1000 - t0) * time_scale
      const current_decomp = time_evolve(psi_basis, decomp_t0, t)
      set_current_psi(superposition(psi_basis, current_decomp))
    })
    return () => { clearInterval(id) }
  }, [decomp_t0, psi_basis, time_scale])
  return (<DrawStuff
    wavefn={current_psi}
    potential_diag={potential_diag}
    v_max={v_max}
  />)
}

function DrawStuff({
  wavefn,
  show_split_wavefn,
  potential_diag, v_max,
  force_update,
}: {
  wavefn?: M.Complex[],
  show_split_wavefn?: boolean,
  potential_diag: number[], v_max: number,
  force_update?: number,
}) {
  const c2d = useC2D()

  useEffect(() => {
    c2d.clear()

    // draw potential
    c2d.line("#777777", ...potential_diag.map((v, i) => [c2d.width * i / (potential_diag.length - 1), c2d.height / 2 * (1 - v / v_max / 2)] satisfies [number, number]))

    // draw wavefunction
    if (wavefn != null) {
      if (show_split_wavefn ?? false) {
        // ... as real and complex waves
        c2d.line("#444444", [0, c2d.height / 2], [c2d.width, c2d.height / 2])
        c2d.line("#ff0000", ...wavefn.map((z, i) => {
          return [i / (wavefn.length - 1) * c2d.width, c2d.height * (0.5 - z.re)] satisfies [number, number]
        }))
        c2d.line("#0000ff", ...wavefn.map((z, i) => {
          return [i / (wavefn.length - 1) * c2d.width, c2d.height * (0.5 - z.im)] satisfies [number, number]
        }))
      } else {
        // ... as a magnitude squared and argument as color 
        c2d.colored_line_path(wavefn.map((z, i) => {
          const { phi, r } = z.toPolar()
          return {
            color: `hsl(${phi}rad, 100%, 50%)`,
            pos: [i / (wavefn.length - 1) * c2d.width, c2d.height * (1 - 5 * r ** 2)]
          }
        }))
      }
    }
  }, [wavefn, force_update])

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
