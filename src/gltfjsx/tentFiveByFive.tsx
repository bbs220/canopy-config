import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type { JSX } from "react";

type GLTFResult = GLTF & {
  nodes: {
    Mesh003: THREE.Mesh;
    Mesh003_1: THREE.Mesh;
    leg5: THREE.Mesh;
    mechanism3: THREE.Mesh;
  };
  materials: {
    fabric_Mat: THREE.MeshStandardMaterial;
    Inner_fabric: THREE.MeshStandardMaterial;
    Metal_mat: THREE.MeshStandardMaterial;
  };
};

export function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/Tent_5_5.glb",
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="TENT_5_5">
          <group name="fabric">
            <mesh
              name="Mesh003"
              castShadow
              receiveShadow
              geometry={nodes.Mesh003.geometry}
              material={materials.fabric_Mat}
            />
            <mesh
              name="Mesh003_1"
              castShadow
              receiveShadow
              geometry={nodes.Mesh003_1.geometry}
              material={materials.Inner_fabric}
            />
          </group>
          <mesh
            name="leg5"
            castShadow
            receiveShadow
            geometry={nodes.leg5.geometry}
            material={materials.Metal_mat}
          />
          <mesh
            name="mechanism3"
            castShadow
            receiveShadow
            geometry={nodes.mechanism3.geometry}
            material={materials.Metal_mat}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/Tent_5_5.glb");
