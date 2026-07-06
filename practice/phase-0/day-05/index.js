function deepClone(value) {
    // 1. Is it a primitive or null? → return it.
    if (value === null || typeof value !== "object") {
      return value;
    }
  
    // 2. Array or object? → make the right empty container.
    const result = Array.isArray(value) ? [] : {};
  
    // 3. Loop the keys.
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        // 4. Recurse on each value.
        result[key] = deepClone(value[key]);
      }
    }
  
    // 5. Return the container.
    return result;
  }
  
  // Spec
  const a = { x: 1, nested: { y: 2 } };
  const b = deepClone(a);
  
  b.nested.y = 99;
  
  console.assert(
    a.nested.y === 2,
    "deepClone shares references!"
  );