import { EXAMPLE_CONNECTORS } from '@mcpforge/domain'
import { GalleryClient } from './_client'

// Server component — imports @mcpforge/domain on the server (Node.js env) so
// node:crypto inside release-packager.ts never reaches the browser bundle.
export default function GalleryPage() {
  return <GalleryClient examples={EXAMPLE_CONNECTORS} />
}
