import 'package:flutter/material.dart';

import '../../../../../vendor_ui/item/detail/component/tiles/vehicle_details_tile_view.dart';

class CustomVehicleDetailsTileView extends StatelessWidget {
  const CustomVehicleDetailsTileView({
    Key? key,
    required this.animationController,
  }) : super(key: key);

  final AnimationController animationController;

  @override
  Widget build(BuildContext context) {
    return VehicleDetailsTileView(
      animationController: animationController,
    );
  }
}
