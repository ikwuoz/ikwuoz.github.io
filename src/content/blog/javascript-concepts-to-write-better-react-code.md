---
title: "JavaScript Concepts to Write Better React Code"
description: "Simple, often overlooked JavaScript patterns—destructuring, conditional execution, spread syntax, reduce, higher-order functions, and template literals—that keep React codebases concise and readable."
pubDate: 2020-07-11
tags:
  - javascript
  - react
  - patterns
  - cleancode
draft: false
---

Beginning development in React can be fun and trivial, however your codebase can quickly get messy, verbose, and unreadable unless careful thought is put into the development process. Writing clean, quality code comes with experience, yet there are simple and often overlooked JavaScript concepts that, when harnessed properly, greatly improve React code quality.

## Object Destructuring

To be honest, I have never seen a professional React codebase without this sugar. It is a simple concept that greatly improves code conciseness. The idea is straightforward: write variables whose names match those of the object to be destructured and hold the same value as the property they mirror.

```javascript
let { foo, baz } = { foo: 1, bar: 'Leave me out', baz: 2 };
console.log(foo, baz); // -> 1, 2
```

In React, destructuring is mostly used to extract variables from component `props` or `state`, avoiding repeated calls to `props.this` or `state.that`. The same pattern applies when destructuring arrays, where element index determines how the assignment executes.

## Conditional Execution

More often we have logic we want to execute based on given criteria. Using a simple `if-else` statement would suffice, however React developers frequently favor the `&&` short-circuit operator instead. The snippet below logs `'Congrats!!!'` when the expression evaluates to `true`.

```javascript
const isAdult = (age) => age >= 18;

isAdult(18) && console.log('Congrats!!!'); // 'Congrats!!!'
```

## Spread Operators

In React codebases you frequently see the spread operator (`...`) used to forward props to components cleanly. Another practical use case is passing arbitrary arguments to a function—for example, computing the mean across a series of numbers:

```javascript
const calc_mean = (...series) =>
  series.reduce((sum, n) => sum + n, 0) / series.length;

const mean = calc_mean(2, 4, 6, 8);
console.log(mean); // 5
```

Using rest and spread syntax, we can evaluate values across an arbitrary number of arguments without boilerplate.

## Flattening with Array.prototype.reduce()

Here, flattening refers to reducing a collection down to a single derived output. Suppose you need to compute percentage reviews for a newly shipped product from a `customers` sample:

```javascript
let customers = [
  { category: 'happy', count: 1200 },
  { category: 'sad', count: 204 },
  { category: 'indifferent', count: 25 },
];

// compute total from customers list
let total = customers.reduce((sum, { count }) => sum + count, 0);

// proceed to compute percent for all categories
let customer_reviews = customers.map((customer) => {
  let percent = (customer.count / total) * 100;
  return { ...customer, percent: percent.toFixed(2) + '%' };
});

console.log(customer_reviews);
```

Combining `Array.prototype.reduce()` with object destructuring and spread syntax produces a clean transformation pipeline without mutating the original array.

## Higher-Order Functions

The category of higher-order functions discussed here involves functions that return another function, which greatly improves conciseness and makes abstracting reusable logic straightforward. Suppose we want to filter a collection against another collection:

```javascript
let invite_ids = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
let friends = [
  { name: 'sam', id: 1 },
  { name: 'jon', id: 13 },
  { name: 'snow', id: 10 },
];
```

> Fun Fact: The `invite_ids` array is actually a Fibonacci series.

If we only want friends whose `id` exists in `invite_ids` to attend the party, we can curry the predicate:

```javascript
const filter_invites = (ids) => ({ id }) => ids.includes(id);

let my_invites = friends.filter(filter_invites(invite_ids));

console.log(my_invites); // [{ name: 'sam', id: 1 }, { name: 'jon', id: 13 }]
```

Notice how concise and expressive this implementation stays while keeping readability intact. The predicate factory `filter_invites` can be extracted, reused, and unit-tested independently.

## Template Literals

Template literals look like standard strings but carry much more capability. They are especially useful wherever expressions or conditional class names need to be interpolated inline.

### Basic Expression Interpolation

```javascript
function greet(name) {
  return `Hello ${name}`;
}

greet('mike'); // Hello mike
```

### Conditional Logic in Templates

```javascript
let friends = ['ola', 'tea', 'mike'];
let className = `box ${friends.length ? 'show' : 'hidden'}`;

console.log(className); // 'box show'
```

By utilizing template literals, we can express inline conditional strings without messy string concatenation.

## Pattern Reference

| Concept | Primary React Use Case | Benefit |
|---|---|---|
| `Object Destructuring` | Unpacking `props` and hook returns | Removes repetitive `props.*` access |
| `Short-Circuit (&&)` | Conditional JSX rendering | Keeps inline render trees terse |
| `Spread / Rest (...)` | Prop forwarding and immutable state updates | Preserves immutability cleanly |
| `Array.prototype.reduce()` | Derived totals and state aggregation | Consolidates collection transforms |
| `Higher-Order Functions` | Reusable event handlers and list predicates | Decouples business logic from UI |
| `Template Literals` | Dynamic `className` and URI assembly | Eliminates manual string concatenation |

There are many more concepts to uncover as you write React code, and this list is by no means exhaustive. Originally published on [DEV](https://dev.to/nuel_ikwuoma/javascript-concepts-to-write-better-react-code-45f0).
