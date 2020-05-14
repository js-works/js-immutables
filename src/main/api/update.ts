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
    select = (...path: string[]) => new ObjectModifier2(state, path),
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
  <K1 extends keyof S>(k1: K1): ObjectModifier<S, S[K1]>,
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): ObjectModifier<S, S[K1][K2]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(k1: K1, k2: K2, k3: K3): ObjectModifier<S, S[K1][K2][K3]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): ObjectModifier<S, S[K1][K2][K3][K4]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): ObjectModifier<S, S[K1][K2][K3][K4][K5]>,
}

type Selector2<S extends State> = {
  <K1 extends keyof S>(k1: K1): ObjectModifier2<S, S[K1]>,
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): ObjectModifier2<S, S[K1][K2]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(k1: K1, k2: K2, k3: K3): ObjectModifier2<S, S[K1][K2][K3]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): ObjectModifier2<S, S[K1][K2][K3][K4]>,
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2], K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): ObjectModifier2<S, S[K1][K2][K3][K4][K5]>,
}

function select<S extends State>(state: S): Selector<S> {
  return (...args: any[]) => new ObjectModifier(state, args) as any // TODO
}

type Update<S extends State, T> = {
  path: string[],
  mapper: (value: T) => T // TODO
}

class ObjectModifier<S extends State, T> {
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

class ObjectModifier2<S extends State, T> {
  private _state: S
  private _path: string[]

  constructor(state: S, path: string[]) {
    this._state = state
    this._path = path
  }

  map(mapper: (value: T) => T) {
    return { path: this._path, mapper }
  }

  set(newValue: T) {
    return { path: this._path, mapper: () => newValue } 
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

type State = Record<string, any>
