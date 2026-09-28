// Members 3D 공간의 배치 계산 (화면과 상관없는 순수 계산)
// - 구 모양 공간(반지름 RADIUS) 안에 프로필을 흩뿌리고, 분야(fields)가 겹치는 사람끼리 당겨서 가깝게 모은다
// - 인원이 늘면 공간을 키우지 않고 프로필 크기를 줄인다 (최대 줌아웃에서 구 전체가 한 화면에 들어오게)
// - 멤버 id로 시드를 잡아 새로고침해도 같은 자리에 온다

export type GalaxyMember = { id: string; fields: string[] }
export type Vec3 = [number, number, number]
export type GalaxyEdge = { a: number; b: number; weight: number }
export type GalaxyLayout = {
  positions: Vec3[]
  edges: GalaxyEdge[]
  /** 프로필 한 변 크기 */
  size: number
  /** 실제로 퍼진 범위(가운데에서 가장 먼 프로필까지). 카메라는 이만큼이 화면에 딱 들어오게 맞춘다 */
  radius: number
}

/** 구 반지름 (월드 단위). 카메라는 이 구가 화면에 딱 들어오게 거리를 정한다 */
export const RADIUS = 10

/** 프로필 사이 간격: 인원이 늘수록 좁아진다 (구 공간은 그대로) */
export const profileGap = (count: number) => (RADIUS * 1.3) / Math.cbrt(Math.max(count, 1))

/** 인원이 늘수록 작아지는 프로필 크기 (한 변, 월드 단위). 간격보다 한참 작게 해서 공간이 넉넉해 보이게 */
export const profileSize = (count: number) => Math.min(1.5, Math.max(0.7, profileGap(count) * 0.42))

function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const normalize = (field: string) => field.trim().toLowerCase()

/** 분야가 하나라도 겹치는 두 사람을 잇는다. 무게 = 겹친 분야 / 두 사람 분야 합 (많이 겹칠수록 1에 가깝다) */
export function fieldEdges(members: GalaxyMember[]): GalaxyEdge[] {
  const sets = members.map((member) => new Set(member.fields.map(normalize).filter(Boolean)))
  const edges: GalaxyEdge[] = []
  for (let a = 0; a < members.length; a += 1) {
    for (let b = a + 1; b < members.length; b += 1) {
      let shared = 0
      sets[a].forEach((field) => sets[b].has(field) && (shared += 1))
      if (shared === 0) continue
      const union = sets[a].size + sets[b].size - shared
      edges.push({ a, b, weight: shared / union })
    }
  }
  return edges
}

export function layoutGalaxy(members: GalaxyMember[]): GalaxyLayout {
  const count = members.length
  const size = profileSize(count)
  const edges = fieldEdges(members)
  if (count === 0) return { positions: [], edges, size, radius: RADIUS }

  // 구 안에 고르게 흩어진 시작점 (피보나치 나선 + 멤버마다 다른 깊이)
  const random = seeded(members.map((member) => member.id).join('|'))
  const golden = Math.PI * (3 - Math.sqrt(5))
  const order = members.map((_, index) => index).sort(() => random() - 0.5)
  const positions: Vec3[] = new Array(count)
  order.forEach((memberIndex, slot) => {
    const y = count === 1 ? 0 : 1 - (slot / (count - 1)) * 2
    const ring = Math.sqrt(1 - y * y)
    const angle = golden * slot
    const depth = RADIUS * 0.75 * Math.cbrt(0.35 + random() * 0.65)
    positions[memberIndex] = [Math.cos(angle) * ring * depth, y * depth, Math.sin(angle) * ring * depth]
  })
  if (count === 1) return { positions: [[0, 0, 0]], edges, size, radius: RADIUS * 0.7 }

  // 힘으로 다듬기: 서로 밀어내고(겹침 방지) · 같은 분야끼리 당기고 · 가운데로 살짝 모으고 · 구 밖으로는 못 나가게
  const gap = profileGap(count)
  const velocity: Vec3[] = positions.map(() => [0, 0, 0])
  const ITERATIONS = 320
  for (let step = 0; step < ITERATIONS; step += 1) {
    const cooling = 1 - step / ITERATIONS
    const force: Vec3[] = positions.map(() => [0, 0, 0])
    for (let a = 0; a < count; a += 1) {
      for (let b = a + 1; b < count; b += 1) {
        const dx = positions[b][0] - positions[a][0]
        const dy = positions[b][1] - positions[a][1]
        const dz = positions[b][2] - positions[a][2]
        const distance = Math.max(Math.hypot(dx, dy, dz), 0.01)
        const push = ((gap * gap) / (distance * distance)) * 0.9
        const deltas = [dx, dy, dz]
        for (let axis = 0; axis < 3; axis += 1) {
          force[a][axis] -= (deltas[axis] / distance) * push
          force[b][axis] += (deltas[axis] / distance) * push
        }
      }
    }
    for (let e = 0; e < edges.length; e += 1) {
      const { a, b, weight } = edges[e]
      const dx = positions[b][0] - positions[a][0]
      const dy = positions[b][1] - positions[a][1]
      const dz = positions[b][2] - positions[a][2]
      const distance = Math.max(Math.hypot(dx, dy, dz), 0.01)
      const pull = (distance - gap) * 0.06 * (0.4 + weight)
      const deltas = [dx, dy, dz]
      for (let axis = 0; axis < 3; axis += 1) {
        force[a][axis] += (deltas[axis] / distance) * pull
        force[b][axis] -= (deltas[axis] / distance) * pull
      }
    }
    for (let i = 0; i < count; i += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        force[i][axis] -= positions[i][axis] * 0.02
        velocity[i][axis] = (velocity[i][axis] + force[i][axis] * 0.05) * 0.8
        positions[i][axis] += velocity[i][axis] * cooling
      }
      clampToSphere(positions[i], RADIUS - size / 2)
    }
  }

  // 마지막으로 겹친 쌍을 떼어 놓는다 (프로필끼리 가리지 않게)
  const minimum = size * 1.2
  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false
    for (let a = 0; a < count; a += 1) {
      for (let b = a + 1; b < count; b += 1) {
        const delta: Vec3 = [
          positions[b][0] - positions[a][0],
          positions[b][1] - positions[a][1],
          positions[b][2] - positions[a][2],
        ]
        const distance = Math.hypot(...delta)
        if (distance >= minimum) continue
        const safe = distance || 0.01
        const shift = (minimum - safe) / 2
        for (let axis = 0; axis < 3; axis += 1) {
          const direction = distance ? delta[axis] / safe : axis === 0 ? 1 : 0
          positions[a][axis] -= direction * shift
          positions[b][axis] += direction * shift
        }
        moved = true
      }
    }
    positions.forEach((position) => clampToSphere(position, RADIUS - size / 2))
    if (!moved) break
  }

  // 카메라는 실제로 퍼진 범위에 맞추되, 인원이 적어도 너무 당겨지지 않게 (프로필이 크게 보이지 않도록)
  const extent = Math.max(RADIUS * 0.7, ...positions.map((position) => Math.hypot(...position)))
  return { positions, edges, size, radius: extent }
}

function clampToSphere(position: Vec3, limit: number) {
  const length = Math.hypot(...position)
  if (length <= limit) return
  const scale = limit / length
  position[0] *= scale
  position[1] *= scale
  position[2] *= scale
}
