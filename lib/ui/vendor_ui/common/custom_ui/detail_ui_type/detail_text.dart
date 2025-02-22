import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../config/ps_colors.dart';

import '../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../core/vendor/provider/product/item_entry_provider.dart';
import '../../../../../core/vendor/utils/utils.dart';
import '../../../../../core/vendor/viewobject/custom_field.dart';
import '../../../../../core/vendor/viewobject/selected_object.dart';

class DetailTextWidget extends StatelessWidget {
  const DetailTextWidget({Key? key, required this.customField})
      : super(key: key);
  final CustomField customField;

  @override
  Widget build(BuildContext context) {
    final ItemEntryFieldProvider itemEntryFieldProvider =
        Provider.of<ItemEntryFieldProvider>(context);
    final MapEntry<CustomField, SelectedObject> element = itemEntryFieldProvider
        .textControllerMap.entries
        .firstWhere((MapEntry<CustomField, SelectedObject> element) =>
            element.key.coreKeyId == customField.coreKeyId);

    return Visibility(
      visible: element.value.valueTextController.text != '',
      child: Container(
        margin: const EdgeInsets.only(
          top: PsDimens.space32,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Text(
              customField.name!,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.text800
                      : PsColors.text50,
                  fontSize: 16,
                  fontWeight: FontWeight.w400),
            ),
            Text(
              element.value.valueTextController.text,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.text800
                      : PsColors.text50,
                  fontSize: 14,
                  fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
