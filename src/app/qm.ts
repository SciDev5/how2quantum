import * as M from "mathjs"

interface SimConfig {
    dx: number,
    m: number,
    hbar: number,
}

export function gen_hamiltonian(potential: number[], { dx, m, hbar }: SimConfig): M.Matrix {
    const U = M.diag(potential) as unknown as number[][] //as M.Matrix
    console.log(U);

    const T = M.zeros([U.length, U.length]) as unknown as number[][]// as M.Matrix

    // -d^2 Q/dx^2 ~~ -(Q[i-1] - 2 * Q[i] + Q[i + 1]) / dx^2
    for (let i = 0; i < U.length; i++) {
        T[i][i] = 2 / (dx * dx) * (hbar ** 2 / (2 * m))
    }
    for (let i = 0; i < U.length - 1; i++) {
        T[i][i + 1] = -1 / (dx * dx) * (hbar ** 2 / (2 * m))
        T[i + 1][i] = -1 / (dx * dx) * (hbar ** 2 / (2 * m))
    }

    return M.matrix(M.add(T, U)) as M.Matrix
}

export function solve_schrodinger(H: M.Matrix): { l: number, v: M.Complex[] }[] {
    return M.eigs(H).eigenvectors.map(({ value, vector }) => ({
        l: value as number,
        v: (
            vector instanceof M.Matrix
                ? vector.toArray()
                : vector
        ).flat().map(
            v_ei => M.complex(v_ei)
        ),
    })).sort((a, b) => a.l - b.l)
}

export function decomposition(vecs: { l: number, v: M.Complex[] }[], target_fn: M.Complex[]): M.Complex[] {
    const target_fn_mag = M.sqrt(M.add(...target_fn.map(v => v.re * v.re + v.im * v.im))) as number
    target_fn.forEach((_, i) => { target_fn[i] = M.multiply(target_fn[i], 1 / target_fn_mag) as M.Complex })

    return vecs.map(
        ({ v }) => M.add(
            ...v.map((_, i) => M.multiply(v[i], target_fn[i]))
        ) as M.Complex
    )
}

export function superposition(vecs: { l: number, v: M.Complex[] }[], sum_spec: M.Complex[]): M.Complex[] {
    return M.add(
        ...sum_spec
            .map(
                (c, i) => vecs[i].v.map(v_i => M.multiply(c, v_i) as M.MathNumericType)
            )
            .filter(v => v != null)
    ) as M.Complex[]
}

export function time_evolve(vecs: { l: number, v: M.Complex[] }[], decomp_t0: M.Complex[], t: number): M.Complex[] {
    return decomp_t0.map((c, i) => M.multiply(c, M.complex({ phi: -vecs[i].l * t, r: 1 })) as M.Complex)
}