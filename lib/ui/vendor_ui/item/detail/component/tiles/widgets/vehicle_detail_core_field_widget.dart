import 'package:flutter/material.dart';

import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/core_field.dart';

class VehicleDetailCoreFieldWidget extends StatelessWidget {
  const VehicleDetailCoreFieldWidget(
      {Key? key, required this.coreField, required this.value})
      : super(key: key);
  final CoreField coreField;
  final String value;
  @override
  Widget build(BuildContext context) {
    return //model
        Visibility(
      visible: coreField.isVisible && value != '',
      child: Container(
        margin: const EdgeInsets.only(
          top: PsDimens.space32,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Text(
              coreField.labelName ?? '',
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.text800
                      : PsColors.text50,
                  fontSize: 16,
                  fontWeight: FontWeight.w400),
            ),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                    color: Utils.isLightMode(context)
                        ? PsColors.text500
                        : PsColors.text50,
                    fontSize: 14,
                    fontWeight: FontWeight.w600
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
