import { Composition } from "remotion";
import { MatchPromo } from "./MatchPromo";
import { GameIdentity, GI_DURATION } from "./GameIdentity";

const FPS = 30;
const DURATION = 150; // 5s

// One source-of-truth template. Render any match by passing its id via
// defaultProps / --props. id "1" = Mexico vs South Africa.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MatchPromo"
      component={MatchPromo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ matchId: "1" }}
    />
    <Composition
      id="MatchPromoSquare"
      component={MatchPromo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1080}
      defaultProps={{ matchId: "1" }}
    />
    <Composition
      id="MatchPromoVertical"
      component={MatchPromo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ matchId: "1" }}
    />
    <Composition
      id="MatchPromo4x3"
      component={MatchPromo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1440}
      height={1080}
      defaultProps={{ matchId: "1" }}
    />
    <Composition
      id="MatchPromo3x4"
      component={MatchPromo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1440}
      defaultProps={{ matchId: "1" }}
    />
    {/* Game Identity — the crest holds while the stat field morphs through all
        22 forms; pass any team slug. */}
    <Composition
      id="GameIdentity"
      component={GameIdentity}
      durationInFrames={GI_DURATION}
      fps={FPS}
      width={1080}
      height={1080}
      defaultProps={{ teamSlug: "mexico" }}
    />
    <Composition
      id="GameIdentity3x4"
      component={GameIdentity}
      durationInFrames={GI_DURATION}
      fps={FPS}
      width={1080}
      height={1440}
      defaultProps={{ teamSlug: "mexico" }}
    />
  </>
);
