export function toggleFullscreen(scale) {
  if (scale.isFullscreen) {
    scale.stopFullscreen();
  } else {
    scale.startFullscreen();
  }
}
