# BoxProjectedReflector

提取了`drei`的`useBoxProjectedEnv`和`CubeCamera`以支持脱离React使用, 这是一种简单有效实现反射效果的方案(相对于`MeshReflectorMaterial`)。

Extracted `useBoxProjectedEnv` and `CubeCamera` from `drei` to support usage outside of React. This is a simple and effective solution for achieving reflection effects (compared to `MeshReflectorMaterial`).

![image](https://github.com/user-attachments/assets/5052a855-d350-4c65-9351-88f00f26bf49)

[useBoxProjectedEnv - Drei](https://drei.docs.pmnd.rs/misc/use-box-projected-env)

## `useBoxProjectedEnv`

在three.js中实现反射的最廉价方法。这会将当前的环境贴图盒投影到一个平面上。它提供了一个配置对象，你需要将其应用到你的材质上。该配置对象包含 `onBeforeCompile` 和 `customProgramCacheKey`。如果你将其与 `drei/CubeCamera` 结合使用，你可以捕获环境的单帧图像并将其用于你的材质，从而以零成本获得逼真的反射效果。确保将其与几何体的位置信息和比例属性对齐。

The cheapest possible way of getting reflections in three.js. This will box-project the current environment map onto a plane. It provides a configuration object that you need to apply to your material. This configuration object contains `onBeforeCompile`, and `customProgramCacheKey`. If you combine it with `drei/CubeCamera`, you can capture a single frame of the environment and use it for your material, thereby achieving realistic reflections at no performance cost. Ensure to align it with the position and scale properties of your geometry.
