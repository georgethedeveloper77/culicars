import 'package:flutter/material.dart';

import '../../../config/ps_colors.dart';
import '../../../core/vendor/constant/ps_dimens.dart';
import '../../../core/vendor/utils/utils.dart';

class PsBottomSheet {
  PsBottomSheet._();

  static void show(BuildContext context, Widget childWidget,
      {String title = ''}) {
    showModalBottomSheet<void>(
        elevation: 2.0,
        isScrollControlled: true,
        useRootNavigator: true,
        isDismissible: true,
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16.0)),
        ),
        builder: (BuildContext context) {
          return ConstrainedBox(
            constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8),
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: <Widget>[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: <Widget>[
                        Text(title,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium!
                                .copyWith(
                                  color: Utils.isLightMode(context)
                                      ? PsColors.text800
                                      : PsColors.text50,
                                )),
                        InkWell(
                            onTap: () {
                              Navigator.pop(context);
                            },
                            child: Icon(
                              Icons.close,
                              color: Utils.isLightMode(context)
                                  ? PsColors.text800
                                  : PsColors.text50,
                            ))
                      ],
                    ),
                    const SizedBox(
                      height: PsDimens.space32,
                    ),
                    childWidget,
                  ],
                ),
              ),
            ),
          );
        });
  }
}
