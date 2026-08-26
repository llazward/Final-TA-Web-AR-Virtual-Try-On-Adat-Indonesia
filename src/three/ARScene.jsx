import { Suspense } from "react";
import AdvancedClothingModel from "./AdvancedClothingModel";
import { getModelUrl, getARConfig } from "../data/catalogData";

export default function ARScene({ pose, selectedClothing, displayMode = "full", sizeOverride = null, selectedGender = "pria" }) {
  const modelUrl = getModelUrl(selectedClothing, displayMode, selectedGender);
  const arConfig = getARConfig(selectedClothing, displayMode);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 5, 5]} intensity={1.5} />
      <directionalLight position={[-2, 5, 5]} intensity={1.5} />
      <pointLight position={[0, 2, 0]} intensity={0.5} />

      <Suspense fallback={null}>
        {selectedClothing && modelUrl && (
          <AdvancedClothingModel
            key={`${selectedClothing.id}-${displayMode}-${selectedGender}-${sizeOverride || 'auto'}`}
            pose={pose}
            clothingUrl={modelUrl}
            arConfig={arConfig}
            sizeOverride={sizeOverride}
          />
        )}
      </Suspense>
    </>
  );
}
