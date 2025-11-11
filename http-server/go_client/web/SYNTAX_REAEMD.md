# React 组件优化与函数依赖详解

## 1. useState 状态持久化机制

React 的 `useState` 使用内部的 fiber 节点记住组件的状态，确保在组件重新渲染时状态不被重置：

```javascript
function Counter() {
  const [count, setCount] = useState(0); // 0 只在初始渲染时使用
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}
```

- 初始渲染时使用初始值
- 重新渲染时返回之前的状态值，忽略初始值参数
- React 通过 fiber 节点维护组件状态

## 2. 闭包问题与 useCallback

### 闭包陷阱：
```javascript
function Component() {
  const [count, setCount] = useState(0);

  // 问题：闭包捕获的是定义时的值
  function handleClick() {
    setTimeout(() => {
      console.log(count); // 总是打印第一次渲染时的值
    }, 1000);
  }
}
```

### 解决方案：
```javascript
const handleClick = useCallback(() => {
  setTimeout(() => {
    console.log(count); // 依赖数组确保使用最新值
  }, [count]);
}, [count]);
```

## 3. useCallback 的依赖管理

### 依赖数组的作用：
```javascript
const handleSynthesize = useCallback(
  async (text) => {
    const speakerAudioPath = selectedFile?.path; // 使用 selectedFile
    await synthesizeTTS(text, speakerAudioPath, null);
    await fetchAudioFiles(); // 使用 fetchAudioFiles
  },
  [fetchAudioFiles, selectedFile, showError, showSuccess] // 依赖数组
);
```

- 确保函数使用最新的状态和函数引用
- 避免陈旧闭包问题
- 保持数据一致性

## 4. React.memo 优化机制

### 工作原理：
```javascript
const MyComponent = memo(({ count, data, callback }) => {
  return <div>{count}</div>;
});
```

- 通过 `===`（严格相等）比较 props 引用
- 默认进行浅比较（只比较一层属性）
- 如果所有 prop 都相同，复用上次的渲染结果

### 默认比较逻辑：
```javascript
const defaultCompare = (prevProps, nextProps) => {
  return Object.keys(nextProps).every(key => 
    nextProps[key] === prevProps[key]
  );
};
```

### 何时使用 memo 有效：
- Props 不经常变化
- 传递稳定引用的函数（通过 useCallback）
- 组件渲染开销较大

### 自定义比较：
```javascript
const MyComponent = memo(
  ({ user }) => <div>{user.name}</div>,
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id; // 只比较 id
  }
);
```

### 注意事项：
- 比较操作本身也有开销
- 对于经常变化的 props，memo 可能无益
- 只进行浅比较，复杂的嵌套对象会返回 false

## 5. useEffect 中的函数依赖

```javascript
const fetchAudioFiles = useCallback(async () => {
  // ...
}, [showError]);

useEffect(() => {
  fetchAudioFiles(); // 确保使用最新版本的函数
}, [fetchAudioFiles]); // 依赖函数本身
```

- 确保 effect 使用最新的函数版本
- 遵循 React Hook 依赖规则
- 避免 ESLint 依赖检查警告

## 6. 性能优化建议

### 不需要 useCallback 的情况：
- 简单的事件处理
- 传递给原生 DOM 元素
- 无依赖的简单操作

### 需要 useCallback 的情况：
- 传递给 memo 优化的子组件
- 作为其他 Hook 的依赖
- 函数中使用了 state 或 props

### 何时使用 memo 不合适：
- Props 经常变化
- 组件渲染开销很小
- 使用深比较（性能开销大）