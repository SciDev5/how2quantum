import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

const REACT_WEBGL_CONTEXT = createContext<null | GLX>(null)

export function useGLX(): GLX {
    return useContext(REACT_WEBGL_CONTEXT) ?? (() => {
        throw "not within context with valid webgl2 context thingy"
    })()
}

export function GL2Canvas({ children }: { children: ReactNode }) {
    const canvas_ref = useRef<HTMLCanvasElement>(null)
    const [glx, set_glx] = useState<GLX | null>(null)
    useEffect(() => {
        const cnv = canvas_ref.current
            ?? (() => { throw "canvas_ref.current was null" })()
        const ctx = cnv.getContext("webgl2")
            ?? (() => { throw "webgl2 is not available, cannot continue" })()
        const glx = new GLX(ctx)
        glx.clear()

        set_glx(glx)
    }, [])

    return (
        <>
            <canvas ref={canvas_ref} width={400} height={400} />
            {glx != null &&
                <REACT_WEBGL_CONTEXT.Provider value={glx}>
                    {children}
                </REACT_WEBGL_CONTEXT.Provider>
            }
        </>
    )
}

class GLX {
    constructor(readonly gl: WebGL2RenderingContext) {
    }
    clear() {
        const { gl } = this
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.clearColor(0.0, 1.0, 1.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
    }
}