// lib/shared/widgets/photo_viewer.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';

/// Full-screen photo viewer with swipe, pinch-zoom, and close button
class PhotoViewer extends StatefulWidget {
  final List<String> photos;
  final int initialIndex;

  const PhotoViewer({
    super.key,
    required this.photos,
    this.initialIndex = 0,
  });

  static void show(BuildContext context, List<String> photos, {int initialIndex = 0}) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      pageBuilder: (_, __, ___) => PhotoViewer(
        photos: photos,
        initialIndex: initialIndex,
      ),
      transitionsBuilder: (_, anim, __, child) =>
          FadeTransition(opacity: anim, child: child),
    ));
  }

  @override
  State<PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<PhotoViewer> {
  late final PageController _pageCtrl;
  late int _current;

  @override
  void initState() {
    super.initState();
    _current = widget.initialIndex;
    _pageCtrl = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.black,
    body: Stack(children: [
      // Photo pages with pinch-zoom
      PageView.builder(
        controller: _pageCtrl,
        onPageChanged: (i) => setState(() => _current = i),
        itemCount: widget.photos.length,
        itemBuilder: (_, i) => InteractiveViewer(
          minScale: 0.5,
          maxScale: 5.0,
          child: Center(
            child: CachedNetworkImage(
              imageUrl: widget.photos[i],
              fit: BoxFit.contain,
              placeholder: (_, __) => const Center(
                  child: CircularProgressIndicator(color: CuliTheme.accent)),
              errorWidget: (_, __, ___) => const Center(
                  child: Icon(Icons.broken_image_outlined,
                      color: CuliTheme.textMuted, size: 64)),
            ),
          ),
        ),
      ),

      // Top bar — close + counter
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(children: [
            // Close button
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
              ),
            ),
            const Spacer(),
            // Counter
            if (widget.photos.length > 1)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_current + 1} / ${widget.photos.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
          ]),
        ),
      ),

      // Bottom dots indicator
      if (widget.photos.length > 1)
        Positioned(
          bottom: 40,
          left: 0, right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.photos.length, (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _current == i ? 20 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _current == i
                    ? CuliTheme.accent
                    : Colors.white.withOpacity(0.4),
                borderRadius: BorderRadius.circular(3),
              ),
            )),
          ),
        ),

      // Swipe hint (only first time)
      if (widget.photos.length > 1 && _current == 0)
        Positioned(
          bottom: 80,
          left: 0, right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.swipe_rounded, color: Colors.white54, size: 16),
                SizedBox(width: 6),
                Text('Swipe to browse · Pinch to zoom',
                    style: TextStyle(color: Colors.white54, fontSize: 12)),
              ]),
            ),
          ),
        ),
    ]),
  );
}