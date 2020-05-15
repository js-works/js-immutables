export default update

function update<S extends State>(state: S): ModifierType<S, S, S> 
function update<S extends State>(state: S, getUpdates: (select: UpdateSelector<S, S>) => Update<S, any>[]): S 
function update<S extends State>(state: S, generateUpdates: (select: UpdateSelector<S, S>) => Generator<Update<S, any>>): S 

function update<S extends State>(state: S, sndArg?: any): any {
  if (typeof sndArg === 'function') {
    const select = (...path: string[]) => {
      return createHandler(state, path, ObjectUpdaterImpl, ArrayUpdaterImpl)
    }

    return performUpdates(state, Array.from(sndArg(select)))
  }

  return createHandler(state, [], ObjectModifierImpl, ArrayModifierImpl)
}

// --- modification (types) ------------------------------------------

type ModifierType<S extends State, B extends Obj, T> =
  IfNeverThenNull<T extends (infer V)[] ? ArrayModifier<S, B, V[]> : never
    | T extends Record<string, any> ? ObjectModifier<S, B, T> : never>

type ModifySelector<S extends State, B extends Obj> = {
  <K1 extends keyof B>(k1: K1): ModifierType<S, B, B[K1]>,
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): ModifierType<S, B, B[K1][K2]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): ModifierType<S, B, B[K1][K2][K3]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): ModifierType<S, B, B[K1][K2][K3][K4]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3], K5 extends keyof B[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): ModifierType<S, B, B[K1][K2][K3][K4][K5]>,
}

type ObjectModifier<S extends State, B extends Obj, T extends Record<string, any>> = {
  path: ModifySelector<S, B>,
  set<K extends keyof T>(key: K, value: T[K]): S
  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): S
}

type ArrayModifier<S extends State, B extends Obj, V> = {
  path: ModifySelector<S, B>,
  push(item: V): S,
  pop(): S,
  filter(pred: (item: V, idx: number) => boolean): S,
  remove(pred: (item: V, idx: number) => boolean): S,
  removeFirst(pred: (item: V, idx: number) => boolean): S,
  removeLast(pred: (item: V, idx: number) => boolean): S,
  clear(): S
}

// --- modifications (impl) ------------------------------------------

class ObjectModifierImpl<S extends State, T extends Record<string, any>> {
  _state: S
  _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  path(...keys: string[]) {
    return new ObjectModifierImpl(this._state, [...this._path, ...keys ]) // TODO!!!!!
  }

  map(key: keyof T, mapper: (value: T) => T): S {
    return performUpdate(this._state, this._path, ObjectOps.map(key, mapper)) 
  }

  set(key: keyof T, newValue: T) {
    return performUpdate(this._state, this._path, ObjectOps.set(key, newValue)) 
  }
}

class ArrayModifierImpl<S extends State, B extends Obj, V> {
  _state: S
  _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  path(...keys: string[]) {
    return new ObjectModifierImpl(this._state, [...this._path, ...keys ]) // TODO!!!!
  }

  push(item: V) {
    return performUpdate(this._state, this._path, ArrayOps.push(item))
  }

  pop(item: V) {
    return performUpdate(this._state, this._path, ArrayOps.pop())
  }

  filter(pred: (item: V, idx: number) => boolean) {
    return performUpdate(this._state, this._path, ArrayOps.filter(pred))
  }

  remove(pred: (item: V, idx: number) => boolean) {
    return performUpdate(this._state, this._path, ArrayOps.remove(pred))
  }

  removeFirst(pred: (item: V, idx: number) => boolean) {
    return performUpdate(this._state, this._path, ArrayOps.removeFirst(pred))
  }

  removeLast(pred: (item: V, idx: number) => boolean) {
    return performUpdate(this._state, this._path, ArrayOps.removeLast(pred))
  }

  clear() {
    return performUpdate(this._state, this._path, ArrayOps.clear())
  }
}

// --- updates (types) -----------------------------------------------

type UpdaterType<S extends State, B extends State, T> =
  IfNeverThenNull<T extends (infer V)[] ? ArrayUpdater<S, V[], V> : never
    | T extends Record<string, any> ? ObjectUpdater<S, T, T> : never>

type ObjectUpdater<S extends State, B extends Obj, T extends Record<string, any>> = {
  select: UpdateSelector<S, B>,
  set<K extends keyof T>(key: K, value: T[K]): Update<S, T> 
  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): Update<S, T>
}

type ArrayUpdater<S extends State, B extends V[], V> = {
  select: UpdateSelector<S, B>,
  push(value: V): Update<S, V[]>,
  pop(value: V): Update<S, V[]>,
  filter(pred: (item: V) => boolean): Update<S, V[]>,
  remove(pred: (item: V, idx: number) => boolean): Update<S, V[]>,
  removeFirst(pred: (item: V, idx: number) => boolean): Update<S, V[]>,
  removeLast(pred: (item: V, idx: number) => boolean): Update<S, V[]>,
  clear(): Update<S, V[]>
}

type UpdateSelector<S extends State, B extends Obj> = {
  <K1 extends keyof B>(k1: K1): UpdaterType<S, B, B[K1]>,
  <K1 extends keyof B, K2 extends keyof B[K1]>(k1: K1, k2: K2): UpdaterType<S, B, B[K1][K2]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2]>(k1: K1, k2: K2, k3: K3): UpdaterType<S, B, B[K1][K2][K3]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): UpdaterType<S, B, B[K1][K2][K3][K4]>,
  <K1 extends keyof B, K2 extends keyof B[K1], K3 extends keyof B[K1][K2], K4 extends keyof B[K1][K2][K3], K5 extends keyof B[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): UpdaterType<S, B, B[K1][K2][K3][K4][K5]>,
}

type Update<S extends State, T> = {
  path: string[],
  mapper: (value: T) => T 
}

// --- updates (impl) ------------------------------------------------

class ObjectUpdaterImpl<S extends State, B extends Obj, T extends Record<string, any>> implements ObjectUpdater<S, B, T> {
  private _state: S
  private _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  select(keys: string[]) {
    return new ObjectUpdaterImpl(this._state, [...this._path, ...keys]) as any // TODO!!!!!
  }

  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): Update<S, T> {
    return createUpdate(this._path, ObjectOps.map(key, mapper))
  }

  set<K extends keyof T>(key: K, newValue: T[K]): Update<S, T> {
    return createUpdate(this._path, ObjectOps.set(key, newValue))
  }
}

class ArrayUpdaterImpl<S extends State, B extends V[], V> implements ArrayUpdater<S, B, V> {
  private _state: S
  private _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }
  
  select(keys: string[]) {
    return new ArrayUpdaterImpl(this._state, [...this._path, ...keys]) as any // TODO!!!!!!!!!!
  }

  push(newItem: V): Update<S, V[]> {
    return createUpdate(this._path, ArrayOps.push(newItem))
  }
  
  pop(): Update<S, V[]> {
    return createUpdate(this._path, ArrayOps.pop())
  }

  filter(pred: (item: V) => boolean) {
    return createUpdate(this._path, ArrayOps.filter(pred))
  }

  remove(pred: (item: V, idx: number) => boolean) {
    return createUpdate(this._path, ArrayOps.remove(pred))
  }

  removeFirst(pred: (item: V, idx: number) => boolean) {
    return createUpdate(this._path, ArrayOps.removeFirst(pred))
  }
 
  removeLast(pred: (item: V, idx: number) => boolean) {
    return createUpdate(this._path, ArrayOps.removeLast(pred))
  }

  clear(): Update<S, V[]> {
    return createUpdate(this._path, ArrayOps.clear())
  }
}

// --- shared types --------------------------------------------------

type Obj = Record<string, any>
type State = Record<string, any> | any[]

type IfNeverThenNull<T> = T extends never ? null : T

// --- shared operations ---------------------------------------------

const ObjectOps = {
  set<T extends Record<string, any>, K extends keyof T>(key: K, newValue: T[K]): (obj: T) => T {
    return (obj: T) => ({ ...obj, [key]: newValue })
  },
  
  map<T extends Record<string, any>, K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): (obj: T) => T {
    return (obj: T) => ({ ...obj, [key]: mapper(obj[key]) })
  }
}

const ArrayOps = {
  push<V>(newItem: V): (arr: V[]) => V[] {
    return (arr: V[]) => [...arr, newItem]
  },
  
  pop<V>(): (arr: V[]) => V[] {
    return (arr: V[]) => {
      const ret = [...arr]
      ret.pop()
      return ret
    }
  },

  filter<V>(pred: (item: V, idx: number) => boolean): (arr: V[]) => V[] {
    return (arr: V[]) => arr.filter(pred)
  },

  remove<V>(pred: (item: V, idx: number) => boolean): (arr: V[]) => V[] {
    return (arr: V[]) => arr.filter((value, idx) => !pred(value, idx))
  },

  removeFirst<V>(pred: (item: V, idx: number) => boolean): (arr: V[]) => V[] {
    return (arr: V[]) => {
      const idx = arr.findIndex(pred)

      return idx >= 0
        ? arr.splice(idx, 1)
        : arr
    }
  },
 
  removeLast<V>(pred: (item: V, idx: number) => boolean): (arr: V[]) => V[] {
    return (arr: V[]) => {
      for (let idx = arr.length - 1; idx >= 0; --idx) {
        if (pred(arr[idx], idx)) {
          return arr.splice(idx, 1)
        }
      }

      return arr
    }
  },

  clear<V>(): (arr: V[]) => V[] {
    return (arr: V[]) => []
  }
}

// --- shared functions ----------------------------------------------

function createHandler(base: any, path: any[], ObjectHandlerClass: any, ArrayHandlerClass: any): any {
  let ret = null

  if (base) {
    let current = base

    for (let i = 0; i < path.length; ++i) {
      const key = path[i]
      current = base[key]

      if (!current) {
        break
      }
    }

    if (Array.isArray(current)) {
      ret = new ArrayHandlerClass(base, path)
    } else if (current && typeof current === 'object') {
      ret = new ObjectHandlerClass(base, path)
    }
  }

  return ret
}

function createUpdate<S extends State, T>(
  path: string[],
  mapper: (value: T) => T
): Update<S, T> {
  return { 
    path,
    mapper
  }
}

function performUpdates<S extends State>(state: S, updates: { path: string[], mapper: (value: any) => any }[]) {
  let state2 = { ...state }
  let modifiedPaths: any = updates.length > 1 ? {} : null // TODO

  updates.forEach(({ path, mapper }) => {
    let pathAsString = ''
    let substate = state2 // TODO - do we really need variable substate?
    let substate2: any = state2
    let parent2 = null

    path.forEach((key, idx) => {
      pathAsString = idx === 0 ? key : '@' + key

      if (!modifiedPaths || !hasOwnProp(modifiedPaths, pathAsString)) {
        substate2[key] = { ...(substate as any)[key] } // TODO!!!!!
        
        if (modifiedPaths) {
          modifiedPaths[pathAsString] = true
        }
      }

      parent2 = substate2
      substate = (substate as any)[key] // TODO!!!!!
      substate2 = substate2[key]
    })
 
    if (parent2) {
      (parent2 as any)[path[path.length - 1]] = mapper(substate2)
    } else {
      state2 = mapper(substate2)
    }
  })

  return state2
}

function performUpdate<S extends State>(state: S, path: string[], mapper: (value: any) => any): S {
  return performUpdates(state, [{ path, mapper }])
}

function hasOwnProp(obj: any, propName: string) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}
