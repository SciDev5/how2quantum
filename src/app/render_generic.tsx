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
        glx.clear(1, 0, 1)

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

export class XShader {
    readonly program: WebGLProgram
    constructor(
        readonly glx: GLX,
        readonly vert_src: string,
        readonly frag_src: string,
    ) {
        const { gl } = glx
        const shader_vert_raw = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(shader_vert_raw, vert_src)
        gl.compileShader(shader_vert_raw)
        const shader_frag_raw = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(shader_frag_raw, frag_src)
        gl.compileShader(shader_frag_raw)

        const program = gl.createProgram()!
        gl.attachShader(program, shader_vert_raw)
        gl.attachShader(program, shader_frag_raw)

        gl.linkProgram(program)

        gl.detachShader(program, shader_vert_raw)
        gl.detachShader(program, shader_frag_raw)
        gl.deleteShader(shader_vert_raw)
        gl.deleteShader(shader_frag_raw)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error_log = gl.getProgramInfoLog(program)
            gl.deleteProgram(program)
            throw new Error("shader compile/link failed:\n" + error_log)
        }
        this.program = program
    }

    use() {
        this.glx.gl.useProgram(this.program)
    }
    destroy() {
        this.glx.gl.deleteProgram(this.program)
    }
    get_uniform_location(name: string): number {
        return this.glx.gl.getUniformLocation(this.program, name) as number
            ?? (() => { throw "typo in get_uniform_location probably" })()
    }
    get_attrib_location(name: string): GLint {
        return this.glx.gl.getAttribLocation(this.program, name)
            ?? (() => { throw "typo in get_uniform_location probably" })()
    }
    // block_binding(name: string, i: number) {
    //     this.glx.gl.uniformBlockBinding(this.program, this.get_uniform_location(name), i)
    // }
}

export class XBuffer {
    readonly buffer: WebGLBuffer
    length = 0
    constructor(
        readonly glx: GLX,
        readonly dim: number,
    ) {
        const { gl } = glx
        gl.enableVertexAttribArray(0)
        this.buffer = gl.createBuffer()!
    }
    bind(i?: number, as_uniform = false) {
        const { gl } = this.glx

        if (i != null) gl.enableVertexAttribArray(i);
        gl.bindBuffer(as_uniform ? gl.UNIFORM_BUFFER : gl.ARRAY_BUFFER, this.buffer);
        if (i != null) gl.vertexAttribPointer(i, this.dim, gl.FLOAT, false, 0, 0);
    }
    write_array(data: number[], as_uniform = false) {
        const { gl } = this.glx
        if (data.length % this.dim !== 0) throw "length does not map cleanly to array of vec" + this.dim

        this.bind(undefined, as_uniform)
        gl.bufferData(as_uniform ? gl.UNIFORM_BUFFER : gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
        this.length = data.length / this.dim
    }
    destroy() {
        const { gl } = this.glx
        gl.deleteBuffer(this.buffer)
    }
}

export class XUBOBuffer {
    readonly buffer: WebGLBuffer
    length = 0
    constructor(
        readonly glx: GLX,
        readonly dim: number,
    ) {
        const { gl } = glx
        gl.enableVertexAttribArray(0)
        this.buffer = gl.createBuffer()!
    }
    bind(i?: number, as_uniform = false) {
        const { gl } = this.glx

        if (i != null) gl.enableVertexAttribArray(i);
        gl.bindBuffer(as_uniform ? gl.UNIFORM_BUFFER : gl.ARRAY_BUFFER, this.buffer);
        if (i != null) gl.vertexAttribPointer(i, this.dim, gl.FLOAT, false, 0, 0);
    }
    write_array(data: number[], as_uniform = false) {
        const { gl } = this.glx
        if (data.length % this.dim !== 0) throw "length does not map cleanly to array of vec" + this.dim

        this.bind(undefined, as_uniform)
        gl.bufferData(as_uniform ? gl.UNIFORM_BUFFER : gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
        this.length = data.length / this.dim
    }
    destroy() {
        const { gl } = this.glx
        gl.deleteBuffer(this.buffer)
    }
}



// export class XTexCx2D {
//     readonly texture: WebGLTexture
//     public pixelarr: Uint16Array
//     constructor(
//         readonly glx: GLX,
//         public dim: { w: number, h: number },
//     ) {
//         const { gl } = glx
//         this.pixelarr = new Uint16Array(dim.w * dim.h * 2)
//         this.texture = gl.createTexture()!;
//     }

//     resize(w: number, h: number) {
//         this.dim.w = w
//         this.dim.h = h
//         this.pixelarr = new Uint16Array(this.dim.w * this.dim.h * 2)
//     }

//     write() {
//         const { gl } = this.glx

//         gl.bindTexture(gl.TEXTURE_2D, this.texture)
//         gl.texImage2D(
//             gl.TEXTURE_2D,
//             0, // level
//             gl.RGBA, // internal format
//             this.dim.w,
//             this.dim.h,
//             0, // border
//             gl.RGBA, // source format
//             gl.UNSIGNED_BYTE, // source type
//             this.pixelarr,
//         )

//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//     }

//     bind(i: WebGLUniformLocation, n: number) {
//         const { gl } = this.glx
//         gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][n])
//         gl.bindTexture(gl.TEXTURE_2D, this.texture)
//         gl.uniform1i(i, n)
//     }

//     destroy() {
//         const { gl } = this.glx
//         gl.deleteTexture(this.texture)
//     }
// }


export class GLX {
    constructor(readonly gl: WebGL2RenderingContext) {
    }
    draw_arrays_line_strip(shader: XShader, start: number, length: number, loop = false) {
        const { gl } = this

        shader.use()
        gl.drawArrays(loop ? gl.LINE_LOOP : gl.LINE_STRIP, start, length)
    }
    clear(r: number, g: number, b: number) {
        const { gl } = this
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.clearColor(r, g, b, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.clear(gl.DEPTH_BUFFER_BIT)
    }
}