---
title: 为什么大语言模型无法推理？
date: 2025-04-24
categories: [深度学习]
cover: https://image.harryrou.wiki/2025-08-03-pdKIS1XC.jpg
description: ""
---

为什么大语言模型无法推理？例如

```
Human: "Emily buys 3 apples and 2 oranges. Each orange costs $2. The total cost of all the fruit is $13. What is the cost of apples?"

❌ Assistant: "**The answer is $3.** This is because 2 oranges at $2 are $4 total. So the 3 apples cost $9, and therefore each apple is 9/3 = $3".

✅ Assistant: "The total cost of the oranges is $4. 13 - 4 = 9, the cost of the 3 apples is $9. 9/3 = 3, so each apple costs $3. **The answer is $3".**
```

这是因为单一的token的算力是有限的，模型需要将复杂的推理过程分散到多个 token 中来完成任务。“These transformers need tokens to think." 

**底层原因**：在使用 ChatGPT 时（推理阶段），模型每生成一个 token 都是通过[[Transformer]]模型所有神经元的一次运算。但是这个计算层数是有限的。nano-gpt的[[MLP 多层感知器]]前馈神经网络只有 3 层，最流行的模型也只有 100 多层。所以结果是**生成一个 token的计算量非常有限。无法进行需要步骤拆解的复杂推理问题。**

**解决办法**：

- 将复杂的推理分散到多个 token 中，以减少每个 token 的算力，让任务更简单。可以使用这样的 prompt：
    - let's think step by step
    - use as many token as you like
    - use code ：模型在生成推理过程的过程更像是我们的一种心算。但如果让模型使用它所熟悉的编程工具，例如 Python，那么结果是由 Python程序运行出来的，会更加准确。
- 使用推理模型，例如o3