import 'package:flutter/material.dart';

import '../../../vendor_ui/add_to_cart/view/add_to_cart_view.dart';

class CustomAddToCartView extends StatelessWidget {
   const CustomAddToCartView({Key? key,  this.animationController,}) : super(key: key);
   final AnimationController? animationController;
  @override
  Widget build(BuildContext context) {
    return  AddToCartView(animationController: animationController,);
  }
}
