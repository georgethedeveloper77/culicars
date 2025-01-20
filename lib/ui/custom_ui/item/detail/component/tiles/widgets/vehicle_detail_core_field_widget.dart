import 'package:flutter/material.dart';

import '../../../../../../../core/vendor/viewobject/core_field.dart';
import '../../../../../../vendor_ui/item/detail/component/tiles/widgets/vehicle_detail_core_field_widget.dart';

class CustomVehicleDetailCoreFieldWidget extends StatelessWidget {
  const CustomVehicleDetailCoreFieldWidget(
      {Key? key, required this.coreField, required this.value})
      : super(key: key);
  final CoreField coreField;
  final String value;
  @override
  Widget build(BuildContext context) {
    return VehicleDetailCoreFieldWidget(coreField: coreField, value: value);
  }
}
