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
    fabric_Mat: THREE.MeshStandardMaterial;
    Inner_fabric: THREE.MeshStandardMaterial;
    Metal_mat: THREE.MeshStandardMaterial;
  };
};

export function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/Tent_6_5.glb",
  ) as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <group name="Scene">
        <group name="TENT_6_5_6_5">
          <group name="fabric">
            <mesh
              name="Mesh"
              castShadow
              receiveShadow
              geometry={nodes.Mesh.geometry}
              material={materials.fabric_Mat}
            />
            <mesh
              name="Mesh_1"
              castShadow
              receiveShadow
              geometry={nodes.Mesh_1.geometry}
              material={materials.Inner_fabric}
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

useGLTF.preload("/Tent_6_5.glb");
