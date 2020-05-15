export default update

function update<S extends State>(state: S): Updater<S> 
function update<S extends State, K extends keyof S>(state: S, key: K): ReturnType<Selector<S>>
function update<S extends State>(state: S, getUpdates: (select: Selector2<S>) => Update<S, any>[]): S 
function update<S extends State>(state: S, generateUpdates: (select: Selector2<S>) => Generator<Update<S, any>>): S 

function update<S extends State>(state: S, sndArg?: any): any {
  if (arguments.length > 1) {
    if (typeof sndArg === 'function') {
      return updateMultiple(state, sndArg)
    } else {
      return update(state).path(sndArg)
    }
  }

  return new Updater(state)
}

function updateMultiple<S extends State>(state: S, getUpdates: (select: Selector2<S>) => Update<S, any>[]): S {
  const
    select = (...path: string[]) => new ObjectUpdaterImpl(state, path),
    updates = Array.from(getUpdates(select as any)) // TODO

  return performUpdates(state, updates)
}

class Updater<S extends State> {
  private _state: S

  constructor(state: S) {
    this._state = state
  }

  path(...path: any[]): ReturnType<Selector<S>> {
    return (select as any)(this._state)(...path) // TODO 
  }
}

type Selector<S extends State> = {
  <K1 extends keyof S>(k1: K1): ObjectModifierImpl<S, S[K1]>,
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): ObjectModifierImpl<S, S[K1][K2]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(k1: K1, k2: K2, k3: K3): ObjectModifierImpl<S, S[K1][K2][K3]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): ObjectModifierImpl<S, S[K1][K2][K3][K4]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): ObjectModifierImpl<S, S[K1][K2][K3][K4][K5]>,
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

class ObjectModifierImpl<S extends State, T> {
  _state: S
  _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  map(mapper: (value: T) => T): S {
    return performUpdate(this._state, this._path, mapper) 
  }

  set(newValue: T) {
    return performUpdate(this._state, this._path, () => newValue) 
  }
}

function performUpdates<S extends State>(state: S, updates: { path: string[], mapper: (value: any) => any }[]) {
  let state2 = { ...state }
  let modifiedPaths: any = updates.length > 1 ? {} : null // TODO

  updates.forEach(({ path, mapper }) => {
    let pathAsString = ''
    let substate = state2 // TODO - do we really need variable substate?
    let substate2: any = state2

    path.forEach((key, idx) => {
      pathAsString = idx === 0 ? key : '@' + key

      if (idx < path.length - 1) {
        if (!modifiedPaths || !hasOwnProp(modifiedPaths, pathAsString)) {
          substate2[key] = { ...substate[key] }
          
          if (modifiedPaths) {
            modifiedPaths[pathAsString] = true
          }
        }

        substate = substate[key]
        substate2 = substate2[key]
      } else {
        substate2[key] = mapper(substate2[key])
      }
    })
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
  set<K extends keyof T>(key: K, value: T[K]): S
  map<K extends keyof T>(key: K, mapper: (value: T[K]) => T[K]): S
}

type ArrayModifier<S extends State, V, T extends V[]> = {
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

type ModifierType<S extends State, T> =
  T extends (infer V)[]
    ? ArrayModifier<S, V, V[]>
    : T extends Record<string, any>
    ? ObjectModifier<S, T>
      : null

type UpdaterType<S extends State, T> =
  T extends (infer V)[]
    ? ArrayUpdater<S, V>
    : T extends Record<string, any>
    ? ObjectUpdater<S, T>
      : null

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
  
  clear(): Update<S, V[]> {
    return createUpdate(this._path, () => [] as V[])
  }
}
