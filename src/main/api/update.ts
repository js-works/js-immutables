export default update

function update<S extends State>(state: S): ModifierType<S, S> 
function update<S extends State>(state: S, getUpdates: (select: Selector2<S>) => Update<S, any>[]): S 
function update<S extends State>(state: S, generateUpdates: (select: Selector2<S>) => Generator<Update<S, any>>): S 

function update<S extends State>(state: S, sndArg?: any): any {
  if (arguments.length > 1) {
    if (typeof sndArg === 'function') {
      return updateMultiple(state, sndArg)
    } else {
      return update(state)
    }
  }

  return new ObjectModifierImpl(state, [])
}

function updateMultiple<S extends State>(state: S, getUpdates: (select: Selector2<S>) => Update<S, any>[]): S {
  const
    select = (...path: string[]) => new ObjectUpdaterImpl(state, path),
    updates = Array.from(getUpdates(select as any)) // TODO

  return performUpdates(state, updates)
}

type Selector<S extends State> = {
  <K1 extends keyof S>(k1: K1): ModifierType<S, S[K1]>,
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): ModifierType<S, S[K1][K2]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(k1: K1, k2: K2, k3: K3): ModifierType<S, S[K1][K2][K3]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): ModifierType<S, S[K1][K2][K3][K4]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): ModifierType<S, S[K1][K2][K3][K4][K5]>,
}

type Selector2<S extends State> = {
  <K1 extends keyof S>(k1: K1): UpdaterType<S, S[K1]>,
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): UpdaterType<S, S[K1][K2]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(k1: K1, k2: K2, k3: K3): UpdaterType<S, S[K1][K2][K3]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): UpdaterType<S, S[K1][K2][K3][K4]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): UpdaterType<S, S[K1][K2][K3][K4][K5]>,
}

function select<S extends State>(state: S): Selector<S> {
  return (...args: any[]) => new ObjectModifierImpl(state, args) as any // TODO
}

type Update<S extends State, T> = {
  path: string[],
  mapper: (value: T) => T // TODO
}

class ObjectModifierImpl<S extends State, T extends Record<string, any>> {
  _state: S
  _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  path(...keys: string[]) { // TODO!!!!!!!!!
    return new ObjectModifierImpl(this._state, [...this._path, ...keys ]) // TODO
  }

  map(key: keyof T, mapper: (value: T) => T): S {
    return performUpdate(this._state, this._path, (obj: T) => ({ ...obj, [key]: mapper(obj[key]) })) 
  }

  set(key: keyof T, newValue: T) {console.log(222222222222222, key)
    return performUpdate(this._state, this._path, (obj: T) => {
      const ret =({ ...obj, [key]: newValue })
      console.log(3333, ret)
      return ret
    })
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
        substate2[key] = { ...substate[key] }
        
        if (modifiedPaths) {
          modifiedPaths[pathAsString] = true
        }
      }

      parent2 = substate2
      substate = substate[key]
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

// ==============================================================

type State = Record<string, any>

type ObjectModifier<S extends State, T extends Record<string, any>> = {
  path(key: any): any, // TODO!!!!!!!!!!!!!!!!!!!!!!!
  set<K extends keyof T>(key: K, value: T[K]): S
  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): S
}

type ArrayModifier<S extends State, V> = {
  push(value: V): S
  clear(): S
}

type ObjectUpdater<S extends State, T extends Record<string, any>> = {
  set<K extends keyof T>(key: K, value: T[K]): Update<S, T> 
  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): Update<S, T>
}

type ArrayUpdater<S extends State, V> = {
  push(value: V): Update<S, V[]>
  clear(): Update<S, V[]>
}

type IfNeverThenNull<T> = T extends never ? null : T

type ModifierType<S extends State, T> =
  IfNeverThenNull<T extends (infer V)[] ? ArrayModifier<S, V[]> : never
    | T extends Record<string, any> ? ObjectModifier<S, T> : never>

type UpdaterType<S extends State, T> =
  IfNeverThenNull<T extends (infer V)[] ? ArrayUpdater<S, V> : never
    | T extends Record<string, any> ? ObjectUpdater<S, T> : never>

function createUpdate<S extends State, T>(
  path: string[],
  mapper: (value: T) => T
): Update<S, T> {
  return { 
    path,
    mapper
  }
}

class ObjectUpdaterImpl<S extends State, T extends Record<string, any>> implements ObjectUpdater<S, T> {
  private _state: S
  private _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): Update<S, T> {
    return createUpdate(this._path, (obj: T) => ({ ...obj, [key]: mapper(obj[key]) }))
  }

  set<K extends keyof T>(key: K, newValue: T[K]): Update<S, T> {
    return createUpdate(this._path, (obj: T) => ({ ...obj, [key]: newValue }))
  }
}

class ArrayUpdaterImpl<S extends State, V> implements ArrayUpdater<S, V> {
  private _state: S
  private _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  push(newItem: V): Update<S, V[]> {
    return createUpdate(this._path, (arr: V[]) => [...arr, newItem])
  }

  filter(pred: (item: V) => boolean) {
    return createUpdate(this._path, (arr: V[]) => arr.filter(pred))
  }

  remove(pred: (item: V, idx: number) => boolean) {
    return createUpdate(this._path,
      (arr: V[]) => arr.filter((value, idx) => !pred(value, idx)))
  }

  removeFirst(pred?: (item: V, idx: number) => boolean) {
    return createUpdate(this._path, (arr: V[]) => {
      const idx = !pred ? 0 : arr.findIndex(pred)

      return arr.splice(idx, 1)
    })
  }
 
  removeLast(pred?: (item: V, idx: number) => boolean) {
    return createUpdate(this._path, (arr: V[]) => {
      if (!pred) {
        return arr.splice(arr.length - 1, 1)
      }

      for (let idx = arr.length - 1; idx >= 0; --idx) {
        if (pred(arr[idx], idx)) {
          return arr.splice(idx, 1)
        }
      }

      return arr
    })
  }

  clear(): Update<S, V[]> {
    return createUpdate(this._path, () => [] as V[])
  }
}
