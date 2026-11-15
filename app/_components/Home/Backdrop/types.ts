/** Its fragment must output colour premultiplied by alpha, as the renderer expects, or translucent pixels come out too bright. */
export interface Visual {
  fragment: string;
}
