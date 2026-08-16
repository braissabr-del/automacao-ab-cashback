"""Teste t de Welch (duas amostras, variancias diferentes) sem dependencias extras."""

from __future__ import annotations

import math


def _mean(xs: list[float]) -> float:
    return sum(xs) / len(xs)


def _var(xs: list[float]) -> float:
    if len(xs) < 2:
        return 0.0
    m = _mean(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)


def _student_t_sf(t: float, df: float) -> float:
    """Cauda superior da distribuicao t via funcao beta incompleta regularizada."""
    if df <= 0:
        return float("nan")
    x = df / (df + t * t)
    p = 0.5 * _betainc(df / 2.0, 0.5, x)
    return p if t > 0 else 1.0 - p


def _betainc(a: float, b: float, x: float) -> float:
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    lbeta = math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)
    front = math.exp(math.log(x) * a + math.log(1 - x) * b - lbeta)
    if x < (a + 1) / (a + b + 2):
        return front * _betacf(a, b, x) / a
    return 1.0 - math.exp(
        math.log(1 - x) * b + math.log(x) * a - lbeta
    ) * _betacf(b, a, 1 - x) / b


def _betacf(a: float, b: float, x: float, iters: int = 200) -> float:
    tiny = 1e-30
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c, d = 1.0, 1.0 - qab * x / qap
    if abs(d) < tiny:
        d = tiny
    d = 1.0 / d
    h = d
    for m in range(1, iters + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        c = 1.0 + aa / c
        if abs(d) < tiny:
            d = tiny
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        c = 1.0 + aa / c
        if abs(d) < tiny:
            d = tiny
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < 1e-12:
            break
    return h


def welch_ttest(sample: list[float], control: list[float]) -> dict:
    """Retorna diferenca de medias, t, graus de liberdade, p bicaudal e IC 95%."""
    a = [float(x) for x in sample if x == x]
    b = [float(x) for x in control if x == x]
    if len(a) < 2 or len(b) < 2:
        return {
            "diff": float("nan"),
            "t": float("nan"),
            "df": float("nan"),
            "p_value": float("nan"),
            "ci": [float("nan"), float("nan")],
        }
    ma, mb = _mean(a), _mean(b)
    va, vb = _var(a), _var(b)
    se = math.sqrt(va / len(a) + vb / len(b))
    diff = ma - mb
    if se == 0:
        return {"diff": diff, "t": 0.0, "df": 0.0, "p_value": 1.0, "ci": [diff, diff]}
    t = diff / se
    df = (va / len(a) + vb / len(b)) ** 2 / (
        (va / len(a)) ** 2 / (len(a) - 1) + (vb / len(b)) ** 2 / (len(b) - 1)
    )
    p = 2 * _student_t_sf(abs(t), df)
    crit = 1.96 if df > 60 else 2.0 + 0.5 * max(0.0, (30 - df)) / 30
    return {
        "diff": diff,
        "t": t,
        "df": df,
        "p_value": min(1.0, max(0.0, p)),
        "ci": [diff - crit * se, diff + crit * se],
    }
