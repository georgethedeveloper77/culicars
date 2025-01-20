import 'package:flutter/material.dart';

import '../../../../../vendor_ui/item/detail/component/gallery_list/product_detail_gallery_widget.dart';

class CustomProductDetailGalleryWidget extends StatefulWidget {
  const CustomProductDetailGalleryWidget({
    Key? key,
  }) : super(key: key);

  @override
  ProductDetailGalleryViewState<CustomProductDetailGalleryWidget>
      createState() =>
          ProductDetailGalleryViewState<CustomProductDetailGalleryWidget>();
}

class ProductDetailGalleryViewState<T extends CustomProductDetailGalleryWidget>
    extends State<CustomProductDetailGalleryWidget> {
  @override
  Widget build(BuildContext context) {
    return const ProductDetailGalleryWidget();
  }
}
