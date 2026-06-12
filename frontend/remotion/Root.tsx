import { Composition } from "remotion";
import { MatchPromo } from "./MatchPromo";

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
  </>
);
