import { describe, it } from 'mocha'
import { expect } from 'chai'
import update from '../../main/api/update'

const state = {
  login: {
    username: 'Jane Doe',
    isAdmin: true
  },

  tasks: [
    { id: 1, text: 'Do something', options: { prio: 'high' } },
    { id: 2, text: 'Do something else', options: { prio: 'low' } },
  ]
}

const
  login = state.login,
  username = login.username,
  tasks = state.tasks,
  task1 = tasks[0],
  task2 = tasks[1]

describe('update', () => {
  it('should perform a "set" operation on direct object properties', () => {
    const result = update(state).set('tasks', [])
    
    expect(result)
      .to.eql({
        ...state,
        tasks: []
      })
  })

  it('should perform a "set" operation properly on nested objects', () => {
    const result = update(state, 'login').set('isAdmin', false)
    
    expect(result)
      .to.eql({
        ...state,
        login: {
          ...state.login,
          isAdmin: false
        }
      })
  })

  it('should perform a "set" operation properly on nested objects (using method `path`)', () => {
    const result = update(state).path('login').set('isAdmin', false)
    
    expect(result)
      .to.eql({
        ...state,
        login: {
          ...state.login,
          isAdmin: false
        }
      })
  })

  it('should perform a "map" operation properly on objects', () => {
    const result = update(state).path('login').map('isAdmin', it => !it)
    
    expect(result)
      .to.eql({
        ...state,
        login: {
          ...state.login,
          isAdmin: false
        }
      })
  })
  
  it('should perform multiple updates properly', () => {
    const result = update(state, select => [
      select('login').set('username', 'John Doe'),
      select('login').map('isAdmin', it => !it),
    ])
    
    expect(result)
      .to.eql({
        ...state,
        login: {
          ...state.login,
          username: 'John Doe',
          isAdmin: false
        }
      })
  })
  
  it('should perform multiple updates by using a generator', () => {
    const result = update(state, function* (select) {
      yield select('login').set('username', 'John Doe'),
      yield select('login').map('isAdmin', it => !it)
    })
    
    expect(result)
      .to.eql({
        ...state,
        login: {
          ...state.login,
          username: 'John Doe',
          isAdmin: false
        }
      })
  })
  
  it('should perform a map an array', () => {
    const result = update(state).path('tasks').map(
      task => update(task).map('text', it => it + '!'))
    
    expect(result)
      .to.eql({
        ...state,
        tasks: [
          { ...task1, text: 'Do something!' },
          { ...task2, text: 'Do something else!' }
        ]
      })
  })
  
  it('should perform a map on the first match of an array', () => {
    const result = update(state).path('tasks').mapFirst(
      task => task.id === 2,
      task => update(task).map('text', it => it + '!'))
    
    expect(result)
      .to.eql({
        ...state,
        tasks: [
          task1,
          { ...task2, text: 'Do something else!' }
        ]
      })
  })
  
  
  it('should perform a `remove` on an array', () => {
    const result = update(state).path('tasks').removeFirst(it => it.id === 1)
    
    expect(result)
      .to.eql({
        ...state,
        tasks: [task2]
      })
  })
  
  it('should perform a `set` on an deep object', () => {
    const result = update(state).path('tasks', 0, 'options').set('prio', 'low')
    
    expect(result)
      .to.eql({
        ...state,
        tasks: [
          { ...task1, options: { ...task1.options, prio: 'low' } },
          task2
        ]
      })
  })
})
