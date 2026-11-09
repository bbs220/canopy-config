import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type { JSX } from "react";

type GLTFResult = GLTF & {
  nodes: {
    Mesh: THREE.Mesh;
    Mesh_1: THREE.Mesh;
    leg: THREE.Mesh;
    mechanism: THREE.Mesh;
  };
  materials: {
    Inner_fabric: THREE.MeshStandardMaterial;
    fabric_Mat: THREE.MeshStandardMaterial;
    Metal_mat: THREE.MeshStandardMaterial;
  };
};

export function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/Tent_8_8.glb",
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="Tent_8_8">
          <group name="fabric">
            <mesh
              name="Mesh"
              castShadow
              receiveShadow
              geometry={nodes.Mesh.geometry}
              material={materials.Inner_fabric}
            />
            <mesh
              name="Mesh_1"
              castShadow
              receiveShadow
              geometry={nodes.Mesh_1.geometry}
              material={materials.fabric_Mat}
            />
          </group>
          <mesh
            name="leg"
            castShadow
            receiveShadow
            geometry={nodes.leg.geometry}
            material={materials.Metal_mat}
          />
          <mesh
            name="mechanism"
            castShadow
            receiveShadow
            geometry={nodes.mechanism.geometry}
            material={materials.Metal_mat}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/Tent_8_8.glb");
