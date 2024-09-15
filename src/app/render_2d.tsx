import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react"

const REACT_2D_CONTEXT = createContext<null | C2D>(null)


export function useC2D(): C2D {
    return useContext(REACT_2D_CONTEXT) ?? (() => {
        throw "not within context with valid webgl2 context thingy"
    })()
}


export function Canvas2D({ children }: { children: ReactNode }) {
    const canvas_ref = useRef<HTMLCanvasElement>(null)
    const [c2d, set_c2d] = useState<C2D | null>(null)
    useEffect(() => {
        const cnv = canvas_ref.current
            ?? (() => { throw "canvas_ref.current was null" })()
        const ctx = cnv.getContext("2d")
            ?? (() => { throw "webgl2 is not available, cannot continue" })()
        const c2d = new C2D(ctx)
        c2d.clear()

        set_c2d(c2d)
    }, [])

    const [, _set_resize_rand] = useState(0)
    useEffect(() => {
        const cb = () => {
            _set_resize_rand(Math.random())
        }
        addEventListener("resize", cb)
        return () => removeEventListener("resize", cb)
    })

    return (
        <>
            <canvas ref={canvas_ref} width={window.innerWidth - 50} height={window.innerHeight - 50 - 50} style={{ margin: 25 }} />
            {c2d != null &&
                <REACT_2D_CONTEXT.Provider value={c2d}>
                    {children}
                </REACT_2D_CONTEXT.Provider>
            }
        </>
    )
}

export class C2D {
    constructor(readonly ctx: CanvasRenderingContext2D) {

    }
    get width(): number { return this.ctx.canvas.width }
    get height(): number { return this.ctx.canvas.height }
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    colored_line_path(points: { color: string, pos: [number, number] }[]) {
        // const z = performance.now()
        for (let i = 0; i < points.length - 1; i++) {
            const m = midpoint(points[i].pos, points[i + 1].pos)
            this.ctx.beginPath()
            this.ctx.moveTo(...points[i].pos)
            this.ctx.lineTo(...m)
            this.ctx.strokeStyle = points[i].color
            this.ctx.stroke()
            this.ctx.beginPath()
            this.ctx.moveTo(...m)
            this.ctx.lineTo(...points[i + 1].pos)
            this.ctx.strokeStyle = points[i + 1].color
            this.ctx.stroke()

        }
        // console.log("colored_line_path", performance.now() - z);

    }
    line(color: string, ...points: [number, number][]) {
        // const z = performance.now()
        this.ctx.beginPath()
        points.forEach(p => this.ctx.lineTo(...p))
        this.ctx.strokeStyle = color
        this.ctx.stroke()
        // console.log("line", performance.now() - z);
    }
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}