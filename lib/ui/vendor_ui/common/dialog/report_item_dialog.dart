import 'package:flutter/material.dart';

import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../core/vendor/utils/utils.dart';
import '../ps_button_widget_with_round_corner.dart';

class ReportConfirmDialogView extends StatefulWidget {
  const ReportConfirmDialogView({Key? key, this.onAgreeTap}) : super(key: key);

  final Function? onAgreeTap;

  @override
  _LogoutDialogState createState() => _LogoutDialogState();
}

class _LogoutDialogState extends State<ReportConfirmDialogView> {
  @override
  Widget build(BuildContext context) {
    return NewDialog(widget: widget);
  }
}

class NewDialog extends StatelessWidget {
  const NewDialog({
    Key? key,
    required this.widget,
  }) : super(key: key);

  final ReportConfirmDialogView widget;

  @override
  Widget build(BuildContext context) {
    final Widget _headerWidget = Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: <Widget>[
        Text(
          'Report Item',
          textAlign: TextAlign.start,
          style: TextStyle(
              color: Utils.isLightMode(context)
                  ? PsColors.text800
                  : PsColors.text50,
              fontSize: 18,
              fontWeight: FontWeight.w600),
        ),
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
    );

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _headerWidget,
            Container(
              padding: const EdgeInsets.only(
                  top: PsDimens.space16, bottom: PsDimens.space24),
              child: Text(
                'report_confirmation'.tr,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium!
                    .copyWith(fontWeight: FontWeight.w400, fontSize: 14),
              ),
            ),
            PSButtonWidgetRoundCorner(
                colorData: Theme.of(context).primaryColor,
                hasShadow: false,
                height: 40,
                titleText: 'report'.tr,
                titleTextColor: PsColors.achromatic50,
                hasBorder: true,
                onPressed: () {
                  widget.onAgreeTap!();
                }),
            const SizedBox(
              height: 16,
            ),
            PSButtonWidgetRoundCorner(
                colorData: Utils.isLightMode(context)
                    ? PsColors.achromatic50
                    : PsColors.achromatic800,
                hasShadow: false,
                height: 40,
                titleTextColor: Theme.of(context).primaryColor,
                titleText: 'dialog__cancel'.tr,
                onPressed: () {
                  Navigator.pop(context);
                }),
          ],
        ),
      ),
    );
  }
}
