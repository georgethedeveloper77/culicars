import 'package:flutter/material.dart';

import '../../../../../core/vendor/viewobject/holder/product_parameter_holder.dart';
import '../../../../vendor_ui/item/list_with_filter/view/product_nearest_list_with_filter_container.dart';

class CustomProductNearestListWithFilterContainerView extends StatefulWidget {
  const CustomProductNearestListWithFilterContainerView(
      {Key? key,
      required this.productParameterHolder,
      required this.appBarTitle})
      : super(key: key);

  final ProductParameterHolder productParameterHolder;
  final String? appBarTitle;

  @override
  State<CustomProductNearestListWithFilterContainerView> createState() =>
      _CustomFilterTabBarContainerState();
}

class _CustomFilterTabBarContainerState
    extends State<CustomProductNearestListWithFilterContainerView> {
  @override
  Widget build(BuildContext context) {
    return ProductNearestListWithFilterContainerView(
        productParameterHolder: widget.productParameterHolder,
        appBarTitle: widget.appBarTitle);
  }
}
