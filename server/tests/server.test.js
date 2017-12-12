const expect = require('expect');
const request = require('supertest');
const {
  ObjectID
} = require('mongodb');
const {
  app
} = require('../server');
const Todo = require('../models/todo');

const todos = [{
    _id: new ObjectID(),
    text: 'first'
  },
  {
    _id: new ObjectID(),
    text: 'second',
    completed: true,
    completedAt: 123
  }
]

beforeEach(done => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'Text from test';
    request(app)
      .post('/todos')
      .send({
        text
      })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({
          text
        }).then(todos => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch(e => done(e));
      });
  });

  it('should not create todo with invalid body data', done => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then(todos => {
          expect(todos.length).toBe(2);
          done();
        }).catch(e => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      }).end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should validate id', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text)
      })
      .end(done);
  });

  it('should return 400 if todo not found', done => {
    request(app)
      .get('/todos/abc')
      .expect(400)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    const id = todos[1]._id.toHexString();
    request(app)
      .delete(`/todos/${id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(id)
      })
      .end((err, res) => {
        if (err) {
          return doen(err);
        }

        Todo.findById(id).then(todo => {
          expect(todo).toBe(null);
          done();
        }).catch(e => done(e));
      });
  });

  it('should return 404 if todo not found', done => {
    const id = new ObjectID();
    request(app)
      .delete(`/todos/${id}`)
      .expect(404)
      .end(done);
  });
});


describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    const id = todos[0]._id.toHexString();
    const text = 'New text';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text)
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id).then(todo => {
          expect(todo.text).toBe(text);
          done();
        }).catch(e => done(e));
      });
  });

  it('should clear completed flag', done => {
    const id = todos[1]._id.toHexString();
    const completed = false;
    request(app)
      .patch(`/todos/${id}`)
      .send({
        completed
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBe(null);
      })
      .end((err, res) => {
        if (err) {
          return doen(err);
        }

        Todo.findById(id).then(todo => {
          expect(todo.completed).toBe(false);
          expect(todo.completedAt).toBe(null);
          done();
        }).catch(e => done(e));
      });
  });
});